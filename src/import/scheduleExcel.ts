import { read, utils } from 'xlsx';
import type { ReviewShift } from '@/src/import/scheduleOcr';

export type ParsedExcelSchedule = {
  nameFound: boolean;
  matchedNameText: string | null;
  shifts: ReviewShift[];
  warnings: string[];
  sheetName: string | null;
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

type NameCandidate = {
  rowIndex: number;
  columnIndex: number;
  text: string;
  normalizedText: string;
  score: number;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9:./ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameScore(value: unknown, configuredName: string) {
  const hay = normalize(value);
  const needle = normalize(configuredName);
  if (!needle || !hay) return 0;
  if (hay === needle) return 100;
  if (hay.includes(needle) && needle.length >= 4) return 90;
  const tokens = needle.split(' ').filter((token) => token.length >= 2);
  if (tokens.length < 2) return 0;
  const hayTokens = hay.split(' ');
  const hits = tokens.filter((token) => hayTokens.includes(token)).length;
  if (hits === tokens.length) return 82;
  if (tokens.length >= 3 && hits === tokens.length - 1) return 60;
  return 0;
}

function findNameCandidates(rows: unknown[][], configuredName: string) {
  const candidates: NameCandidate[] = [];
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      const score = nameScore(cell, configuredName);
      if (score > 0) {
        candidates.push({
          rowIndex,
          columnIndex,
          text: String(cell ?? '').trim(),
          normalizedText: normalize(cell),
          score,
        });
      }
    });
  });
  return candidates.sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex || a.columnIndex - b.columnIndex);
}

function selectName(rows: unknown[][], configuredName: string) {
  const ranked = findNameCandidates(rows, configuredName);
  const best = ranked[0] ?? null;
  if (!best) {
    return {
      candidate: null,
      warning: 'No encontré el nombre configurado en esta planilla. Revisa cómo apareces en el archivo.',
    };
  }
  if (best.score < 80) {
    return {
      candidate: null,
      warning: `Encontré una coincidencia parcial (“${best.text}”), pero no es suficientemente segura para elegir tu fila.`,
    };
  }
  const competing = ranked.find((candidate, index) => index > 0
    && candidate.normalizedText !== best.normalizedText
    && candidate.score >= 80
    && candidate.score >= best.score - 10);
  if (competing) {
    return {
      candidate: null,
      warning: `Encontré más de una fila compatible con tu nombre (“${best.text}” y “${competing.text}”). No elegí ninguna automáticamente.`,
    };
  }
  return { candidate: best, warning: null };
}

function dayHeaderIndex(value: unknown) {
  const text = normalize(value);
  return DAY_WORDS.findIndex((variants) => variants.some((variant) => text === variant || text.includes(variant)));
}

function findDayColumns(rows: unknown[][], beforeRow: number) {
  const found = new Map<number, number>();
  rows.slice(0, Math.max(0, beforeRow)).forEach((row) => {
    row.forEach((cell, columnIndex) => {
      const day = dayHeaderIndex(cell);
      if (day >= 0 && !found.has(day)) found.set(day, columnIndex);
    });
  });
  return found;
}

function timeFromMinutes(totalMinutes: number) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseTimeValue(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || value >= 1) return null;
    return timeFromMinutes(value * 1440);
  }
  const text = String(value ?? '').trim();
  if (!text) return null;
  const normalized = text.replace(/[hH]/g, ':').replace(/(?<=\d)\.(?=\d{2}\b)/g, ':');
  const match = normalized.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?::\d{2})?(?:\s|$)/);
  if (match) return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
  const numeric = Number(text.replace(',', '.'));
  if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) return timeFromMinutes(numeric * 1440);
  return null;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function shiftMinutes(start: string, end: string) {
  let duration = toMinutes(end) - toMinutes(start);
  if (duration < 0) duration += 1440;
  return duration;
}

function inferType(start: string, end: string): ReviewShift['type'] {
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

function shiftFromValues(
  day: number,
  values: unknown[],
  sourceText: string,
  confidence: ReviewShift['confidence'],
): ReviewShift {
  const start = parseTimeValue(values[0]);
  const breakTime = parseTimeValue(values[1]);
  const end = parseTimeValue(values[2]);

  if (start === '00:00' && end === '00:00' && (!breakTime || breakTime === '00:00')) {
    return {
      day,
      label: DAYS[day],
      start: '',
      end: '',
      breakMinutes: 0,
      type: 'off',
      off: true,
      confidence,
      issue: null,
      sourceText,
    };
  }

  if (!start || !end) return emptyShift(day, 'No pude leer entrada y salida en sus celdas.', sourceText);
  if (!breakTime) return emptyShift(day, 'No pude leer la colación de este día.', sourceText);

  const breakMinutes = toMinutes(breakTime);
  if (breakMinutes < 0 || breakMinutes > 180) {
    return emptyShift(day, 'La celda de colación no parece una duración válida.', sourceText);
  }

  const duration = shiftMinutes(start, end);
  if (duration < 180 || duration > 840) {
    return emptyShift(day, 'La entrada y salida leídas no forman una jornada razonable.', sourceText);
  }

  return {
    day,
    label: DAYS[day],
    start,
    end,
    breakMinutes,
    type: inferType(start, end),
    off: false,
    confidence,
    issue: null,
    sourceText,
  };
}

function structuredShifts(row: unknown[], dayColumns: Map<number, number>) {
  if (dayColumns.size !== 7) return null;
  const shifts: ReviewShift[] = [];
  for (let day = 0; day < 7; day += 1) {
    const column = dayColumns.get(day);
    if (column === undefined) return null;
    const values = [row[column], row[column + 1], row[column + 2]];
    shifts.push(shiftFromValues(day, values, values.map((value) => String(value ?? '')).join(' | '), 'high'));
  }
  return shifts;
}

function sequentialShifts(row: unknown[], nameColumn: number) {
  const values = row.slice(nameColumn + 1)
    .map((value) => ({ raw: value, time: parseTimeValue(value) }))
    .filter((entry) => entry.time !== null);
  if (values.length < 21) return null;

  const firstWeek = values.slice(0, 21);
  return Array.from({ length: 7 }, (_, day) => {
    const group = firstWeek.slice(day * 3, day * 3 + 3).map((entry) => entry.raw);
    return shiftFromValues(day, group, group.map((value) => String(value ?? '')).join(' | '), 'medium');
  });
}

export function parseScheduleRows(rows: unknown[][], configuredName: string): ParsedExcelSchedule {
  const selected = selectName(rows, configuredName);
  if (!selected.candidate) {
    return {
      nameFound: false,
      matchedNameText: null,
      shifts: DAYS.map((_, day) => emptyShift(day, selected.warning ?? 'No pude identificar tu fila con seguridad.')),
      warnings: [selected.warning ?? 'No pude identificar tu fila con seguridad.'],
      sheetName: null,
    };
  }

  const { rowIndex, columnIndex, text } = selected.candidate;
  const row = rows[rowIndex] ?? [];
  const dayColumns = findDayColumns(rows, rowIndex);
  let shifts = structuredShifts(row, dayColumns);
  const warnings: string[] = [];

  if (shifts) {
    warnings.push('Leí las siete columnas de la planilla directamente por día. Revisa la propuesta antes de confirmar.');
  } else {
    shifts = sequentialShifts(row, columnIndex);
    if (shifts) {
      warnings.push('No pude usar todos los encabezados, así que reconstruí los 21 valores de la semana en orden Entrada · Colación · Salida. Revisa la propuesta antes de confirmar.');
    }
  }

  if (!shifts) {
    shifts = DAYS.map((_, day) => emptyShift(day, 'No pude reconstruir este día desde la planilla.'));
    warnings.push('Encontré tu nombre, pero no pude reconstruir siete días completos sin adivinar. Dejé la semana pendiente para revisión manual.');
  }

  if (shifts.some((shift) => shift.issue)) {
    warnings.push('Hay días pendientes. WeekFlow no guardará la semana hasta que los corrijas.');
  }

  return {
    nameFound: true,
    matchedNameText: text,
    shifts,
    warnings,
    sheetName: null,
  };
}

export async function readScheduleExcel(uri: string, configuredName: string): Promise<ParsedExcelSchedule> {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  const workbook = read(new Uint8Array(buffer), { type: 'array', cellDates: false });
  let fallback: ParsedExcelSchedule | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' }) as unknown[][];
    const parsed = parseScheduleRows(rows, configuredName);
    const withSheet = { ...parsed, sheetName };
    if (parsed.nameFound) {
      return {
        ...withSheet,
        warnings: [`Hoja “${sheetName}”.`, ...parsed.warnings],
      };
    }
    if (!fallback) fallback = withSheet;
  }

  return fallback ?? {
    nameFound: false,
    matchedNameText: null,
    shifts: DAYS.map((_, day) => emptyShift(day, 'La planilla no contiene una hoja legible.')),
    warnings: ['No encontré una hoja legible en este archivo.'],
    sheetName: null,
  };
}
