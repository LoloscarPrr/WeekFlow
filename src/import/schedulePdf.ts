import { extractText, isAvailable } from 'expo-pdf-text-extract';
import type { ParsedSchedule, ReviewShift } from './scheduleOcr';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9:./ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTimes(text: string) {
  const normalized = text
    .replace(/[hH]/g, ':')
    .replace(/(\d)\.(\d{2}\b)/g, '$1:$2');
  return [...normalized.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)]
    .map((match) => `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function shiftType(start: string, end: string): ReviewShift['type'] {
  const startHour = Number(start.slice(0, 2));
  const endHour = Number(end.slice(0, 2));
  if (endHour < startHour || startHour >= 19) return 'night';
  if (startHour < 11) return 'morning';
  if (startHour >= 12 && startHour < 19) return 'afternoon';
  return 'custom';
}

function emptyShift(day: number, issue: string, sourceText = ''): ReviewShift {
  return {
    day,
    label: DAYS[day],
    start: '',
    end: '',
    breakMinutes: 0,
    type: 'custom',
    off: false,
    confidence: 'low',
    issue,
    sourceText,
  };
}

function buildShift(day: number, values: string[], sourceText: string): ReviewShift {
  if (values.length < 2) return emptyShift(day, 'No pude leer entrada y salida para este día.', sourceText);

  const [start, second, third] = values;
  const end = third ?? second;
  const breakTime = third ? second : null;

  if (start === '00:00' && end === '00:00') {
    return {
      day,
      label: DAYS[day],
      start: '',
      end: '',
      breakMinutes: 0,
      type: 'off',
      off: true,
      confidence: 'medium',
      issue: null,
      sourceText,
    };
  }

  let duration = toMinutes(end) - toMinutes(start);
  if (duration < 0) duration += 1440;
  if (duration < 180 || duration > 840) {
    return emptyShift(day, 'La lectura no forma una jornada razonable. Revisa este día.', sourceText);
  }

  const breakMinutes = breakTime ? toMinutes(breakTime) : 0;
  const breakLooksValid = breakMinutes >= 0 && breakMinutes <= 180;

  return {
    day,
    label: DAYS[day],
    start,
    end,
    breakMinutes: breakLooksValid ? breakMinutes : 0,
    type: shiftType(start, end),
    off: false,
    confidence: third && breakLooksValid ? 'high' : 'medium',
    issue: breakLooksValid ? null : 'La colación detectada parece ambigua. Revisa este día.',
    sourceText,
  };
}

export function parseSchedulePdfText(text: string, configuredName: string): ParsedSchedule {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const needle = normalize(configuredName);

  const nameIndex = lines.findIndex((line) => {
    const hay = normalize(line);
    if (!needle) return false;
    if (hay === needle || hay.includes(needle)) return true;
    const tokens = needle.split(' ').filter((token) => token.length >= 2);
    return tokens.length >= 2 && tokens.every((token) => hay.split(' ').includes(token));
  });

  if (nameIndex < 0) {
    const warning = 'No encontré tu nombre en el PDF. Revisa cómo apareces en la planilla.';
    return {
      nameFound: false,
      matchedNameText: null,
      rowText: '',
      shifts: DAYS.map((_, day) => emptyShift(day, warning)),
      warnings: [warning],
    };
  }

  const nearby = lines.slice(nameIndex, Math.min(lines.length, nameIndex + 8));
  let rowText = nearby[0];
  let times = parseTimes(rowText);
  for (let index = 1; index < nearby.length && times.length < 14; index += 1) {
    rowText += ` ${nearby[index]}`;
    times = parseTimes(rowText);
  }

  const warnings: string[] = [];
  let shifts: ReviewShift[];

  if (times.length >= 21) {
    const weekTimes = times.slice(0, 21);
    shifts = DAYS.map((_, day) => {
      const values = weekTimes.slice(day * 3, day * 3 + 3);
      return buildShift(day, values, values.join(' '));
    });
  } else if (times.length >= 14) {
    const weekTimes = times.slice(0, 14);
    warnings.push('El PDF no trae una colación clara para todos los días. Revisa esos valores antes de confirmar.');
    shifts = DAYS.map((_, day) => {
      const values = weekTimes.slice(day * 2, day * 2 + 2);
      return buildShift(day, values, values.join(' '));
    });
  } else {
    const warning = 'Encontré tu nombre, pero no pude reconstruir los siete días con seguridad. Completa los campos dudosos antes de confirmar.';
    warnings.push(warning);
    shifts = DAYS.map((_, day) => emptyShift(day, warning, rowText));
  }

  const ambiguous = shifts.filter((shift) => shift.issue || shift.confidence !== 'high').length;
  if (ambiguous && !warnings.length) {
    warnings.push(`Hay ${ambiguous} día${ambiguous === 1 ? '' : 's'} que conviene revisar antes de guardar.`);
  }

  return {
    nameFound: true,
    matchedNameText: lines[nameIndex],
    rowText,
    shifts,
    warnings,
  };
}

export async function readSchedulePdf(uri: string, configuredName: string): Promise<ParsedSchedule> {
  if (!isAvailable()) {
    throw new Error('PDF_TEXT_UNAVAILABLE');
  }
  const text = await extractText(uri);
  if (!text?.trim()) {
    throw new Error('PDF_NO_TEXT');
  }
  return parseSchedulePdfText(text, configuredName);
}
