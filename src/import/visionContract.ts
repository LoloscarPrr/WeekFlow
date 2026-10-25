import { classifyShift } from '../domain/services/shiftSchedule';
import type { ParsedSchedule, ReviewShift } from './scheduleOcr';

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function text(value: unknown, max = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function cleanName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function clock(value: unknown): string {
  const time = text(value, 8);
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '';
}
function minuteOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function unresolved(day: number, reason: string, sourceText = ''): ReviewShift {
  return {
    day, label: DAYS[day], start: '', end: '', breakMinutes: null, type: 'custom',
    off: false, confidence: 'low', issue: reason, sourceText,
  };
}

export function normalizeVisionSchedule(input: unknown, configuredName: string): ParsedSchedule {
  const root = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  const match = text(root.matchedName, 100);
  const configured = cleanName(configuredName);
  const found = cleanName(match);
  // A short first name may match the start of a longer full name, but never
  // permit a different first name or ambiguous duplicate worker row.
  const identity = Boolean(configured && found
    && (found === configured || found.startsWith(configured + ' '))
    && root.rowMatchCount === 1);
  const warnings = Array.isArray(root.warnings)
    ? root.warnings.filter((v): v is string => typeof v === 'string').map((v) => v.slice(0, 180)).slice(0, 7)
    : [];
  if (!identity) warnings.unshift('No hay una única fila con el nombre solicitado. No atribuí ese horario a tu cuenta.');
  const items = Array.isArray(root.shifts) ? root.shifts : [];
  const byDay = new Map<number, Record<string, unknown>>();
  const duplicates = new Set<number>();
  for (const value of items) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const obj = value as Record<string, unknown>;
    if (!Number.isInteger(obj.day) || (obj.day as number) < 0 || (obj.day as number) > 6) continue;
    const day = obj.day as number;
    if (byDay.has(day)) duplicates.add(day);
    else byDay.set(day, obj);
  }
  const shifts: ReviewShift[] = DAYS.map((label, day) => {
    const item = byDay.get(day);
    if (!identity) return unresolved(day, 'No se pudo verificar tu fila del horario.');
    if (duplicates.has(day)) return unresolved(day, 'El mismo día aparece repetido.');
    if (!item) return unresolved(day, 'La imagen no permitió reconocer este día.');
    const sourceText = text(item.sourceText, 160);
    const start = clock(item.start);
    const end = clock(item.end);
    const off = item.off === true;
    const confidence: ReviewShift['confidence'] =
      item.confidence === 'high' || item.confidence === 'medium' ? item.confidence : 'low';
    const suggestedIssue = text(item.issue, 150);
    if (off) {
      const contradiction = Boolean((start && start !== '00:00') || (end && end !== '00:00')
        || (item.breakMinutes !== null && item.breakMinutes !== 0));
      if (contradiction) return unresolved(day, 'Dice día libre, pero aparecen horas o colación contradictorias.', sourceText);
      return {
        day, label, start: '', end: '', breakMinutes: 0, type: 'off', off: true,
        confidence, sourceText,
        issue: confidence === 'low' ? 'Confirma que realmente es día libre.' : suggestedIssue || null,
      };
    }
    const breakMinutes = typeof item.breakMinutes === 'number'
      && Number.isInteger(item.breakMinutes)
      && item.breakMinutes >= 0 && item.breakMinutes <= 180 ? item.breakMinutes : null;
    const duration = start && end ? (minuteOf(end) - minuteOf(start) + 1440) % 1440 : 0;
    const issue = suggestedIssue
      || (!start || !end ? 'No pude identificar entrada y salida.' : '')
      || (!duration || duration < 180 || duration > 840 ? 'Verifica estas horas: la duración no es coherente.' : '')
      || (breakMinutes === null ? 'No pude leer la colación, confirma su duración.' : '')
      || (breakMinutes !== null && breakMinutes >= duration ? 'La colación no puede durar más que la jornada.' : '')
      || (confidence === 'low' ? 'La imagen no permite confirmar este día.' : '');
    return {
      day, label, start, end, breakMinutes, type: start && end ? classifyShift(start,end) : 'custom',
      off: false, confidence, issue: issue || null, sourceText,
    };
  });

  if (items.length !== 7) warnings.push('El modelo no reconoció exactamente siete días, revisa los pendientes.');
  if (shifts.some((shift) => shift.issue)) warnings.push('Corrige los días señalados antes de confirmar la semana.');
  return { nameFound: identity, matchedNameText: identity ? match : null, rowText: '',
    shifts, warnings: [...new Set(warnings)].slice(0, 9) };
}
