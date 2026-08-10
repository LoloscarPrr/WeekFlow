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
type RowCluster = { center: number; items: PositionedText[] };

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

  const candidates: Array<{ start: string; end: string; score: number }> = [];
  for (let i = 0; i < times.length; i += 1) {
    for (let j = i + 1; j < times.length; j += 1) {
      const start = times[i];
      const end = times[j];
      const duration = shiftMinutes(start, end);
      if (duration < 3 * 60 || duration > 14 * 60) continue;

      const excluded = times.filter((_, index) => index !== i && index !== j);
      let score = duration >= 5 * 60 && duration <= 12 * 60 ? 8 : 3;
      if (excluded.some(isLikelyBreakDuration)) score += 5;
      if (isLikelyBreakDuration(start)) score -= 12;
      if (start === '00:00') score -= 5;
      candidates.push({ start, end, score });
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
  if (times.length >= 2 && times.every((time) => time === '00:00')) {
    return {
      day,
      label: DAYS[day],
      start: '',
      end: '',
      type: 'off',
      off: true,
      confidence,
      issue: null,
      sourceText,
    };
  }

  if (times.length < 2) return emptyShift(day, 'No pude leer este día con seguridad.', sourceText);

  const chosen = chooseShiftPair(times);
  if (!chosen) return emptyShift(day, 'No pude separar entrada, salida y colación.', sourceText);

  return {
    day,
    label: DAYS[day],
    start: chosen.start,
    end: chosen.end,
    type: shiftType(chosen.start, chosen.end),
    off: false,
    confidence,
    issue: times.length > 3 ? 'Detecté valores adicionales en esta columna; revisa la jornada.' : null,
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

function clusterRows(items: PositionedText[], threshold: number): RowCluster[] {
  const sorted = [...items].sort((a, b) => centerY(a.frame) - centerY(b.frame));
  const clusters: RowCluster[] = [];

  for (const item of sorted) {
    const y = centerY(item.frame);
    const target = clusters.find((cluster) => Math.abs(cluster.center - y) <= threshold);
    if (!target) {
      clusters.push({ center: y, items: [item] });
      continue;
    }
    target.items.push(item);
    target.center = target.items.reduce((sum, current) => sum + centerY(current.frame), 0) / target.items.length;
  }

  return clusters;
}

function fittedDayCenters(headers: Map<number, PositionedText>) {
  const points = [...headers.entries()].map(([day, item]) => ({ day, x: centerX(item.frame) }));
  if (points.length < 2) return null;

  const meanDay = points.reduce((sum, point) => sum + point.day, 0) / points.length;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + (point.day - meanDay) * (point.x - meanX), 0);
  const denominator = points.reduce((sum, point) => sum + (point.day - meanDay) ** 2, 0);
  if (!denominator) return null;

  const gap = numerator / denominator;
  if (!Number.isFinite(gap) || Math.abs(gap) < 8) return null;
  const intercept = meanX - gap * meanDay;
  return {
    gap: Math.abs(gap),
    centers: Array.from({ length: 7 }, (_, day) => intercept + gap * day),
  };
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

  const timeAtoms = atomic.filter((item) => parseTimes(item.text).length > 0);
  const typicalHeight = median(timeAtoms.map((item) => height(item.frame))) || height(best.frame);
  const clusters = clusterRows(timeAtoms, Math.max(5, typicalHeight * 0.8));
  const nameY = centerY(best.frame);
  const candidateRows = clusters.filter((cluster) => cluster.items.length >= 2);
  const selectedRow = candidateRows
    .map((cluster) => ({
      cluster,
      score: Math.abs(cluster.center - nameY) - Math.min(cluster.items.length, 24) * 0.3,
    }))
    .sort((a, b) => a.score - b.score)[0]?.cluster ?? null;

  const rowCenter = selectedRow?.center ?? nameY;
  const rowBand = Math.max(10, typicalHeight * 1.35);
  const rowItems = atomic
    .filter((item) => Math.abs(centerY(item.frame) - rowCenter) <= rowBand)
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
  const fit = fittedDayCenters(headers);

  if (fit && headers.size >= 2) {
    const halfWidth = fit.gap * 0.48;
    for (let day = 0; day < 7; day += 1) {
      const center = fit.centers[day];
      const cellItems = rowItems.filter((item) => Math.abs(centerX(item.frame) - center) <= halfWidth);
      const cellText = cellItems.map((item) => item.text).join(' ');
      const times = cellItems.flatMap((item) => parseTimes(item.text));
      shifts.push(fromTimes(day, times, cellText, headers.has(day) ? 'high' : 'medium'));
    }
    warnings.push('Leí cada día por su posición real en la tabla. No completé días que el OCR no pudo leer.');
  } else {
    for (let day = 0; day < 7; day += 1) {
      shifts.push(emptyShift(day, 'No pude ubicar esta columna con seguridad.', rowText));
    }
    warnings.push('No pude reconstruir las columnas de la semana con seguridad. Dejé los días pendientes en vez de inventar horarios.');
  }

  if (shifts.some((shift) => shift.confidence === 'low' || shift.issue)) {
    warnings.push('Hay datos pendientes de revisión antes de guardar.');
  }

  return {
    nameFound: true,
    matchedNameText: best.text,
    rowText,
    shifts,
    warnings,
  };
}
