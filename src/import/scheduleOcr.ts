import type { ShiftType } from '@/src/brain/types';

export type OcrRect = { left: number; top: number; right: number; bottom: number };
export type OcrElement = { text: string; frame: OcrRect };
export type OcrLine = { text: string; frame: OcrRect; elements?: OcrElement[] };
export type OcrBlock = { text: string; frame: OcrRect; lines: OcrLine[] };
export type OcrTextResult = { text: string; blocks: OcrBlock[] };

export type ReviewShift = {
  day: number;
  label: string;
  start: string;
  end: string;
  type: ShiftType;
  off: boolean;
  confidence: 'high' | 'medium' | 'low';
  issue: string | null;
  sourceText: string;
};

export type ParsedSchedule = {
  nameFound: boolean;
  matchedNameText: string | null;
  rowText: string;
  shifts: ReviewShift[];
  warnings: string[];
};

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_WORDS = [
  ['LUNES', 'LUN'],
  ['MARTES', 'MAR'],
  ['MIERCOLES', 'MIE'],
  ['JUEVES', 'JUE'],
  ['VIERNES', 'VIE'],
  ['SABADO', 'SAB'],
  ['DOMINGO', 'DOM'],
];

type PositionedText = { text: string; frame: OcrRect };

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9:./ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function centerY(frame: OcrRect) {
  return (frame.top + frame.bottom) / 2;
}

function centerX(frame: OcrRect) {
  return (frame.left + frame.right) / 2;
}

function height(frame: OcrRect) {
  return Math.max(1, frame.bottom - frame.top);
}

function flattenLines(result: OcrTextResult): OcrLine[] {
  return result.blocks.flatMap((block) => block.lines?.length ? block.lines : [{ text: block.text, frame: block.frame }]);
}

function flattenAtomic(result: OcrTextResult): PositionedText[] {
  const elements = result.blocks.flatMap((block) =>
    (block.lines ?? []).flatMap((line) => line.elements?.length ? line.elements : []),
  );
  if (elements.length) return elements;
  return flattenLines(result).map((line) => ({ text: line.text, frame: line.frame }));
}

function nameScore(text: string, configuredName: string) {
  const hay = normalize(text);
  const needle = normalize(configuredName);
  if (!needle) return 0;
  if (hay === needle) return 100;
  if (hay.includes(needle)) return 90;
  const tokens = needle.split(' ').filter((token) => token.length >= 2);
  if (!tokens.length) return 0;
  const hits = tokens.filter((token) => hay.includes(token)).length;
  if (hits === tokens.length) return 80;
  if (hits >= Math.max(1, tokens.length - 1)) return 55;
  return 0;
}

function parseTimes(text: string) {
  const normalized = text.replace(/[hH]/g, ':').replace(/(?<=\d)\.(?=\d{2}\b)/g, ':');
  const matches = [...normalized.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
  return matches.map((match) => `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function shiftMinutes(start: string, end: string) {
  let duration = toMinutes(end) - toMinutes(start);
  if (duration < 0) duration += 24 * 60;
  return duration;
}

function isLikelyBreakDuration(time: string) {
  const minutes = toMinutes(time);
  return minutes > 0 && minutes <= 90;
}

function chooseShiftPair(times: string[]) {
  if (times.length < 2) return null;

  const candidates: Array<{ start: string; end: string; score: number; excludedBreak: boolean }> = [];
  for (let i = 0; i < times.length; i += 1) {
    for (let j = i + 1; j < times.length; j += 1) {
      const start = times[i];
      const end = times[j];
      const duration = shiftMinutes(start, end);
      if (duration < 3 * 60 || duration > 14 * 60) continue;

      const excluded = times.filter((_, index) => index !== i && index !== j);
      const excludedBreak = excluded.some(isLikelyBreakDuration);
      let score = 0;
      if (duration >= 5 * 60 && duration <= 12 * 60) score += 5;
      else score += 2;
      if (excludedBreak) score += 4;
      if (isLikelyBreakDuration(start)) score -= 8;
      if (start === '00:00' && end === '00:00') score -= 10;
      candidates.push({ start, end, score, excludedBreak });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function shiftType(start: string, end: string): ShiftType {
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
    type: 'custom',
    off: false,
    confidence: 'low',
    issue,
    sourceText,
  };
}

function fromTimes(day: number, times: string[], sourceText: string, confidence: ReviewShift['confidence']): ReviewShift {
  if (times.length < 2) return emptyShift(day, 'No pude leer entrada y salida con seguridad.', sourceText);

  if (times.every((time) => time === '00:00')) {
    return emptyShift(day, 'Leí solo 00:00. Confirma si ese día es libre.', sourceText);
  }

  const chosen = chooseShiftPair(times);
  if (!chosen) return emptyShift(day, 'No pude separar jornada y colación con seguridad.', sourceText);

  return {
    day,
    label: DAYS[day],
    start: chosen.start,
    end: chosen.end,
    type: shiftType(chosen.start, chosen.end),
    off: false,
    confidence,
    issue: times.length > 3
      ? 'Detecté valores adicionales en esta columna; revisa la jornada.'
      : null,
    sourceText,
  };
}

function dayHeaderIndex(text: string) {
  const value = normalize(text);
  return DAY_WORDS.findIndex((variants) => variants.some((variant) => value === variant || value.includes(variant)));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function parseScheduleOcr(result: OcrTextResult, configuredName: string): ParsedSchedule {
  const lines = flattenLines(result).filter((line) => line.text?.trim());
  const atomic = flattenAtomic(result).filter((item) => item.text?.trim());
  const searchUnits: PositionedText[] = [...lines, ...atomic];

  const ranked = searchUnits
    .map((item) => ({ item, score: nameScore(item.text, configuredName) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.item ?? null;
  if (!best) {
    return {
      nameFound: false,
      matchedNameText: null,
      rowText: '',
      shifts: DAYS.map((_, day) => emptyShift(day, 'No encontré tu nombre en la planilla.')),
      warnings: ['No encontré el nombre configurado. Revisa cómo apareces en la planilla o usa una captura más nítida.'],
    };
  }

  const rowTolerance = Math.max(12, height(best.frame) * 1.15);
  const rowItems = atomic
    .filter((item) => Math.abs(centerY(item.frame) - centerY(best.frame)) <= rowTolerance)
    .sort((a, b) => centerX(a.frame) - centerX(b.frame));
  const rowText = rowItems.map((item) => item.text).join(' | ');

  const headerCandidates = atomic
    .map((item) => ({ item, day: dayHeaderIndex(item.text) }))
    .filter((entry) => entry.day >= 0);

  const headers = new Map<number, PositionedText>();
  for (const entry of headerCandidates) {
    if (!headers.has(entry.day)) headers.set(entry.day, entry.item);
  }

  const shifts: ReviewShift[] = [];
  const warnings: string[] = [];

  if (headers.size >= 4) {
    const headerCenters = [...headers.entries()]
      .map(([day, item]) => ({ day, x: centerX(item.frame), item }))
      .sort((a, b) => a.x - b.x);
    const gaps = headerCenters.slice(1).map((entry, index) => entry.x - headerCenters[index].x).filter((gap) => gap > 0);
    const typicalGap = median(gaps) || 80;

    for (let day = 0; day < 7; day += 1) {
      const current = headers.get(day);
      if (!current) {
        shifts.push(emptyShift(day, 'No pude ubicar la columna de este día.', rowText));
        continue;
      }

      const x = centerX(current.frame);
      const previous = headerCenters.filter((entry) => entry.x < x).at(-1);
      const next = headerCenters.find((entry) => entry.x > x);
      const left = previous ? (previous.x + x) / 2 : x - typicalGap * 0.55;
      const right = next ? (x + next.x) / 2 : x + typicalGap * 0.55;

      const cellItems = rowItems.filter((item) => {
        const cx = centerX(item.frame);
        return cx >= left && cx < right;
      });
      const cellText = cellItems.map((item) => item.text).join(' ');
      const normalizedCell = normalize(cellText);

      if (/\b(LIBRE|DESCANSO|OFF)\b/.test(normalizedCell)) {
        shifts.push({ day, label: DAYS[day], start: '', end: '', type: 'off', off: true, confidence: 'high', issue: null, sourceText: cellText });
        continue;
      }

      const times = cellItems.flatMap((item) => parseTimes(item.text));
      shifts.push(fromTimes(day, times, cellText, 'high'));
    }

    warnings.push('Leí la tabla usando la posición real de cada celda. Las columnas externas, como el total semanal, quedaron fuera.');
  } else {
    const normalizedRow = normalize(rowText);
    const allTimes = rowItems.flatMap((item) => parseTimes(item.text));
    if (/\b(LIBRE|DESCANSO|OFF)\b/.test(normalizedRow)) {
      warnings.push('Detecté palabras de descanso, pero no todas las columnas del calendario. Revisa cada día antes de confirmar.');
    }

    const hasDailyTriples = allTimes.length >= 21;
    for (let day = 0; day < 7; day += 1) {
      const dayTimes = hasDailyTriples
        ? allTimes.slice(day * 3, day * 3 + 3)
        : allTimes.slice(day * 2, day * 2 + 2);
      shifts.push(fromTimes(day, dayTimes, dayTimes.join(' '), 'medium'));
    }

    warnings.push(hasDailyTriples
      ? 'No pude ubicar todas las cabeceras; interpreté tres valores por día y dejé la revisión obligatoria.'
      : 'No pude identificar todas las cabeceras de días; organicé las horas de izquierda a derecha para que las revises.');
  }

  if (shifts.some((shift) => shift.confidence === 'low' || shift.issue)) {
    warnings.push('Hay datos que necesitan revisión antes de guardar. WeekFlow no los completará por su cuenta.');
  }

  return {
    nameFound: true,
    matchedNameText: best.text,
    rowText,
    shifts,
    warnings,
  };
}
