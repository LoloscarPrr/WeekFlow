import { summarizeWeekReview } from '../src/import/reviewSummary';
import { prepareSmartImport, validateSmartImportShift } from '../src/brain/smartImport';
import { defaultWeekState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';
import type { ReviewShift } from '../src/import/scheduleOcr';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) throw new Error(message + ': esperaba ' + expected + ', recibido ' + actual);
}
function ok(value: unknown, message: string) { if (!value) throw new Error(message); }

const names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const before: WeekSchedule = {
  ...defaultWeekState,
  shifts: names.map((_, day) => ({
    day,
    start: day === 0 || day === 6 ? '' : day === 3 ? '22:00' : '07:00',
    end: day === 0 || day === 6 ? '' : day === 3 ? '06:00' : '15:00',
    type: day === 0 || day === 6 ? 'off' : day === 3 ? 'night' : 'morning',
    breakMinutes: day === 0 || day === 6 ? 0 : 30,
  })),
};
const review: ReviewShift[] = before.shifts.map((shift) => ({
  ...shift,
  label: names[shift.day],
  off: shift.type === 'off',
  breakMinutes: shift.breakMinutes ?? 0,
  confidence: 'high',
  issue: null,
  sourceText: 'OCR detectado',
}));
const unchanged = summarizeWeekReview(review.slice().reverse(), before);
equal(unchanged.valid, true, 'horario completo válido');
equal(unchanged.unchangedCount, 7, 'mismo horario, no se fuerza edición');
equal(unchanged.rows[0].day, 0, 'el resumen siempre es lunes a domingo');
equal(unchanged.changeCount, 0, 'no confundir metadata OCR con cambio de horario');
ok(unchanged.rows[3].proposed.includes('22:00–06:00'), 'resumen de turno nocturno');
const changed = review.map((shift) => shift.day === 2
  ? { ...shift, breakMinutes: 0, confidence: 'medium' as const, sourceText: 'Otra lectura' } : shift);
const diff = summarizeWeekReview(changed, before);
equal(diff.valid, true, 'colación 0 confirmada es válida');
equal(diff.changeCount, 1, 'cambio de colación genera exactamente un cambio');
equal(diff.rows[2].status, 'changed', 'cambio se destaca');
ok(diff.rows[2].previous?.includes('colación 30 min'), 'muestra colación previa');
ok(diff.rows[2].proposed.includes('colación 0 min'), 'muestra colación nueva');
equal(diff.rows[3].status, 'unchanged', 'no inventa cambios por horarios de noche');
const freeChange = review.map((shift) => shift.day === 4
  ? { ...shift, off: true, type: 'off' as const, start: '', end: '', breakMinutes: 0 } : shift);
equal(summarizeWeekReview(freeChange, before).rows[4].status, 'changed', 'turno a libre se compara');
const workChange = review.map((shift) => shift.day === 0
  ? { ...shift, off: false, type: 'morning' as const, start: '07:00', end: '15:00', breakMinutes: 30 } : shift);
equal(summarizeWeekReview(workChange, before).rows[0].status, 'changed', 'libre a turno se compara');

const unknownBreak = review.map((shift) => shift.day === 2
  ? { ...shift, breakMinutes: null, issue: 'No pude leer la colación.' } : shift);
const pending = summarizeWeekReview(unknownBreak, before);
equal(pending.valid, false, 'colación desconocida bloquea confirmar');
equal(pending.reviewCount, 1, 'abrir solo el día dudoso');
equal(pending.rows[2].status, 'review', 'pendiente prioritario');
equal(prepareSmartImport(before, unknownBreak, 'excel', 'OSCAR').status, 'review-required',
  'UI y Brain comparten decisión');
const offConflict = review.map((shift) => shift.day === 0
  ? { ...shift, start: '08:00', off: true, issue: null } : shift);
equal(summarizeWeekReview(offConflict, before).valid, false, 'día libre con horas bloqueado');
ok(Boolean(validateSmartImportShift(offConflict[0])), 'el mismo validador Brain identifica contradicción');
const lowConfidence = review.map((shift) => shift.day === 5
  ? { ...shift, confidence: 'low' as const, issue: null } : shift);
equal(summarizeWeekReview(lowConfidence, before).rows[5].status, 'review',
  'confianza baja no salta revisión');
const invalidTime = review.map((shift) => shift.day === 1
  ? { ...shift, start: '25:99', issue: null } : shift);
equal(summarizeWeekReview(invalidTime, before).valid, false, 'hora inválida no llega a confirmación');
const dup = [...review.slice(0, 6), { ...review[5] }];
equal(summarizeWeekReview(dup, before).valid, false, 'duplicado bloquea confirmación');
const missing = review.slice(0, 6);
equal(summarizeWeekReview(missing, before).valid, false, 'seis días no bastan');
const repaired = unknownBreak.map((shift) => shift.day === 2
  ? { ...shift, breakMinutes: 30, issue: null, confidence: 'high' as const } : shift);
equal(summarizeWeekReview(repaired, before).valid, true, 'solo después de corregir habilita');
equal(summarizeWeekReview(repaired, before).reviewCount, 0, 'tras corregir no quedan pendientes');
equal(summarizeWeekReview(review, null).changeCount, 7, 'sin semana previa se presenta cada día');
console.log('Smart Import focused seven-day review tests passed.');
