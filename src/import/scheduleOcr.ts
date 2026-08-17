import type { ShiftType } from '../domain/entities/Shift';

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
  breakMinutes: number | null;
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
type DaySlots = { start: string | null; breakTime: string | null; end: string | null; sourceText: string };
type NameCandidate = { item: PositionedText; score: number; normalizedText: string };

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
  if (hay.includes(needle) && needle.length >= 4) return 90;

  const tokens = needle.split(' ').filter((token) => token.length >= 2);
  if (tokens.length < 2) return 0;
  const hits = tokens.filter((token) => hay.split(' ').includes(token)).length;
  if (hits === tokens.length) return 82;
  if (tokens.length >= 3 && hits === tokens.length - 1) return 60;
  return 0;
}

function uniqueNameCandidates(items: PositionedText[], configuredName: string): NameCandidate[] {
  const candidates = items
    .map((item) => ({ item, score: nameScore(item.text, configuredName), normalizedText: normalize(item.text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const unique: NameCandidate[] = [];
  for (const candidate of candidates) {
    const duplicate = unique.some((existing) =>
      existing.normalizedText === candidate.normalizedText
      && Math.abs(centerY(existing.item.frame) - centerY(candidate.item.frame)) <= Math.max(height(existing.item.frame), height(candidate.item.frame)),
    );
    if (!duplicate) unique.push(candidate);
  }
  return unique;
}

function selectName(items: PositionedText[], configuredName: string) {
  const ranked = uniqueNameCandidates(items, configuredName);
  const best = ranked[0] ?? null;
  if (!best) return { item: null, warning: 'No encontré el nombre configurado. Revisa cómo apareces en la planilla o usa una captura más nítida.' };

  if (best.score < 80) {
    return {
      item: null,
      warning: `Encontré una coincidencia parcial (“${best.item.text}”), pero no es suficientemente segura para elegir tu fila.`,
    };
  }

  const competing = ranked.find((candidate, index) =>
    index > 0
    && candidate.normalizedText !== best.normalizedText
    && candidate.score >= best.score - 8,
  );
  if (competing) {
    return {
      item: null,
      warning: `Encontré más de una fila compatible con tu nombre (“${best.item.text}” y “${competing.item.text}”). No elegí ninguna automáticamente.`,
    };
  }

  return { item: best.item, warning: null };
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
  return minutes > 0 && minutes <= 180;
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
    breakMinutes: 0,
    type: 'custom',
    off: false,
    confidence: 'low',
    issue,
    sourceText,
  };
}

function reviewIssueForConfidence(confidence: ReviewShift['confidence']) {
  return confidence === 'medium'
    ? 'Lectura de confianza media. Revisa o vuelve a escribir este día antes de guardar.'
    : null;
}

function fromStructuredSlots(day: number, slots: DaySlots, confidence: ReviewShift['confidence']): ReviewShift {
  const { start, breakTime, end, sourceText } = slots;
  const readValues = [start, breakTime, end].filter((value): value is string => Boolean(value));

  if (readValues.length >= 2 && readValues.every((value) => value === '00:00')) {
    return {
      day,
      label: DAYS[day],
      start: '',
      end: '',
      breakMinutes: 0,
      type: 'off',
      off: true,
      confidence,
      issue: reviewIssueForConfidence(confidence),
      sourceText,
    };
  }

  if (!start || !end) return emptyShift(day, 'No pude leer entrada y salida en sus celdas.', sourceText);

  if (start === '00:00' && end === '00:00') {
    return {
      day,
      label: DAYS[day],
      start: '',
      end: '',
      breakMinutes: 0,
      type: 'off',
      off: true,
      confidence,
      issue: breakTime && breakTime !== '00:00'
        ? 'El día parece libre, pero la celda de colación es distinta de 00:00.'
        : reviewIssueForConfidence(confidence),
      sourceText,
    };
  }

  if (isLikelyBreakDuration(start) || isLikelyBreakDuration(end)) {
    return emptyShift(day, 'Una duración corta cayó en Entrada o Salida. Revisa este día.', sourceText);
  }

  const duration = shiftMinutes(start, end);
  if (duration < 3 * 60 || duration > 14 * 60) {
    return emptyShift(day, 'La entrada y salida leídas no forman una jornada razonable.', sourceText);
  }

  const breakLooksValid = !breakTime || breakTime === '00:00' || isLikelyBreakDuration(breakTime);
  const issue = !breakLooksValid
    ? 'La celda central no parece una colación; revisa este día.'
    : reviewIssueForConfidence(confidence);

  return {
    day,
    label: DAYS[day],
    start,
    end,
    breakMinutes: breakTime ? toMinutes(breakTime) : 0,
    type: shiftType(start, end),
    off: false,
    confidence,
    issue,
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

  return clusters.sort((a, b) => a.center - b.center);
}

function fittedDayCenters(headers: Map<number, PositionedText>) {
  const points = [...headers.entries()].map(([day, item]) => ({ day, x: centerX(item.frame) }));
  if (points.length < 2) return null;

  const meanDay = points.reduce((sum, point) => sum + point.day, 0) / points.length;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + (point.day - meanDay) * (point.x - meanX), 0);
  const denominator = points.reduce((sum, point) => sum + (point.day - meanDay) ** 2, 0);
  if (!denominator) return null;

  const signedGap = numerator / denominator;
  if (!Number.isFinite(signedGap) || Math.abs(signedGap) < 24) return null;
  const intercept = meanX - signedGap * meanDay;
  return { gap: Math.abs(signedGap), centers: Array.from({ length: 7 }, (_, day) => intercept + signedGap * day) };
}

function readDaySlots(rowItems: PositionedText[], dayCenter: number, dayGap: number): DaySlots {
  const left = dayCenter - dayGap * 0.5;
  const right = dayCenter + dayGap * 0.5;
  const entries = rowItems
    .flatMap((item) => parseTimes(item.text).map((time, order) => ({ time, item, x: centerX(item.frame), order })))
    .filter((entry) => entry.x >= left && entry.x < right)
    .sort((a, b) => a.x - b.x || a.order - b.order);

  const sourceItems = entries
    .map((entry) => entry.item)
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((a, b) => centerX(a.frame) - centerX(b.frame));
  const sourceText = sourceItems.map((item) => item.text).join(' ');

  if (entries.length >= 3) return { start: entries[0].time, breakTime: entries[1].time, end: entries[2].time, sourceText };
  if (entries.length === 2 && entries.every((entry) => entry.time === '00:00')) {
    return { start: '00:00', breakTime: '00:00', end: null, sourceText };
  }
  return { start: entries[0]?.time ?? null, breakTime: null, end: entries[1]?.time ?? null, sourceText };
}

export function parseScheduleOcr(result: OcrTextResult, configuredName: string): ParsedSchedule {
  const lines = flattenLines(result).filter((line) => line.text?.trim());
  const atomic = flattenAtomic(result).filter((item) => item.text?.trim());
  const searchUnits: PositionedText[] = [...lines, ...atomic];
  const selectedName = selectName(searchUnits, configuredName);
  const best = selectedName.item;

  if (!best) {
    return {
      nameFound: false,
      matchedNameText: null,
      rowText: '',
      shifts: DAYS.map((_, day) => emptyShift(day, selectedName.warning ?? 'No pude identificar tu fila con seguridad.')),
      warnings: [selectedName.warning ?? 'No pude identificar tu fila con seguridad.'],
    };
  }

  const timeAtoms = atomic.filter((item) => parseTimes(item.text).length > 0);
  const typicalHeight = median(timeAtoms.map((item) => height(item.frame))) || height(best.frame);
  const clusters = clusterRows(timeAtoms, Math.max(3, typicalHeight * 0.42));
  const nameY = centerY(best.frame);
  const candidateRows = clusters.filter((cluster) => cluster.items.length >= 2);
  const selectedIndex = candidateRows
    .map((cluster, index) => ({ index, distance: Math.abs(cluster.center - nameY) }))
    .sort((a, b) => a.distance - b.distance)[0]?.index ?? -1;
  const selectedRow = selectedIndex >= 0 ? candidateRows[selectedIndex] : null;

  if (!selectedRow || Math.abs(selectedRow.center - nameY) > Math.max(typicalHeight * 2.5, 60)) {
    return {
      nameFound: true,
      matchedNameText: best.text,
      rowText: '',
      shifts: DAYS.map((_, day) => emptyShift(day, 'Encontré tu nombre, pero no pude asociarlo con una fila de horarios con seguridad.')),
      warnings: ['Encontré tu nombre, pero la fila de horas quedó demasiado lejos o incompleta. No inventé ningún horario.'],
    };
  }

  const rowCenter = selectedRow.center;
  const previousRow = selectedIndex > 0 ? candidateRows[selectedIndex - 1] : null;
  const nextRow = selectedIndex < candidateRows.length - 1 ? candidateRows[selectedIndex + 1] : null;
  const topBound = previousRow ? (previousRow.center + rowCenter) / 2 : rowCenter - typicalHeight;
  const bottomBound = nextRow ? (rowCenter + nextRow.center) / 2 : rowCenter + typicalHeight;

  const rowItems = atomic
    .filter((item) => {
      const y = centerY(item.frame);
      return y >= topBound && y < bottomBound;
    })
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
    for (let day = 0; day < 7; day += 1) {
      const slots = readDaySlots(rowItems, fit.centers[day], fit.gap);
      shifts.push(fromStructuredSlots(day, slots, headers.has(day) ? 'high' : 'medium'));
    }
    warnings.push('Leí cada día dentro de su bloque real y ordené sus horas como entrada, colación y salida. El total semanal quedó fuera.');
  } else {
    for (let day = 0; day < 7; day += 1) {
      shifts.push(emptyShift(day, 'No pude ubicar esta columna con seguridad.', rowText));
    }
    warnings.push('No pude reconstruir las columnas de la semana con seguridad. Dejé los días pendientes en vez de inventar horarios.');
  }

  if (shifts.some((shift) => shift.confidence !== 'high' || shift.issue)) {
    warnings.push('Hay días pendientes de revisión manual antes de guardar. Toca o reescribe sus datos para confirmarlos.');
  }

  return { nameFound: true, matchedNameText: best.text, rowText, shifts, warnings };
}
