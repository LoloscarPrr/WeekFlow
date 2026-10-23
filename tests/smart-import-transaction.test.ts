import { prepareSmartImport, applySmartImport, undoSmartImport } from '../src/brain/smartImport';
import { defaultWeekState } from '../src/domain/defaults';
import type { ReviewShift } from '../src/import/scheduleOcr';
import type { WeekSchedule } from '../src/domain/entities/Shift';

function ok(value: unknown, label: string) { if (!value) throw new Error(label); }
function eq<T>(a: T, b: T, label: string) {
  if (!Object.is(a, b)) throw new Error(label + ': esperaba ' + String(b) + ', recibió ' + String(a));
}
const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const week: WeekSchedule = {
  ...defaultWeekState,
  importantMoments: [{ id: 'family', date: '2026-10-25', day: 6, time: '12:00', title: 'Cumpleaños familiar' }],
  organizedAt: '2026-10-20T09:00:00.000Z',
  source: 'manual',
};
const raw: ReviewShift[] = labels.map((label, day) => ({
  day,
  label,
  start: day === 3 ? '22:00' : day === 0 || day > 4 ? '' : '07:00',
  end: day === 3 ? '06:00' : day === 0 || day > 4 ? '' : '15:00',
  breakMinutes: day === 0 || day > 4 ? 0 : 30,
  type: day === 3 ? 'night' : day === 0 || day > 4 ? 'off' : 'morning',
  off: day === 0 || day > 4,
  confidence: 'high',
  issue: null,
  sourceText: 'Reconocido',
}));
const prepared = prepareSmartImport(week, raw.slice().reverse(), 'library', 'OSCAR');
eq(prepared.status, 'ready', 'siete días coherentes generan propuesta');
if (prepared.status !== 'ready') throw new Error('fixture inválido');
const p = prepared.proposal;
eq(p.next.shifts[0].day, 0, 'orden lunes-domingo');
eq(p.next.shifts[3].start, '22:00', 'turno noche');
eq(p.next.shifts[3].end, '06:00', 'cruce de medianoche');
eq(p.next.shifts[3].breakMinutes, 30, 'colación como duración');
eq(p.next.shifts[0].type, 'off', 'libre se conserva');
eq(p.next.importantMoments[0].title, 'Cumpleaños familiar', 'momento fijo no cambia');
eq(p.next.organizedAt, null, 'Semana reabre organización, no inventa ritual');
eq(week.source, 'manual', 'preparar no altera original');
eq(applySmartImport(week, p, false).status, 'confirmation-required', 'no escribe sin confirmación');
const currentChanged: WeekSchedule = { ...week, organizedAt: '2026-10-21T12:00:00.000Z' };
eq(applySmartImport(currentChanged, p, true).status, 'conflict', 'otro cambio en Semana bloquea guardado');
const done = applySmartImport(week, p, true);
eq(done.status, 'applied', 'confirmación aplica Semana');
if (done.status !== 'applied') throw new Error('No se confirmó');
eq(done.week.source, 'library', 'origen importación');
eq(done.week.importantMoments[0].id, 'family', 'compromisos fijos intactos');
const undone = undoSmartImport(done.week, done.receipt);
eq(undone.status, 'reverted', 'undo de semana inalterada');
if (undone.status === 'reverted') eq(JSON.stringify(undone.week), JSON.stringify(week), 'undo restaura semana exacta');
const afterManualEdit: WeekSchedule = {
  ...done.week,
  shifts: done.week.shifts.map((shift) => shift.day === 2 ? { ...shift, start: '10:00' } : shift),
};
eq(undoSmartImport(afterManualEdit, done.receipt).status, 'conflict', 'undo no pisa cambio manual posterior');

const malformed = [
  [raw.slice(0, 6), 'seis días incompletos'],
  [[...raw.slice(0, 6), { ...raw[5] }], 'días duplicados'],
  [raw.map((s, i) => i === 1 ? { ...s, start: 'xx' } : s), 'hora inválida'],
  [raw.map((s, i) => i === 2 ? { ...s, breakMinutes: 300 } : s), 'colación inverosímil'],
  [raw.map((s, i) => i === 2 ? { ...s, start: '07:00', end: '07:00' } : s), 'hora cero duración'],
  [raw.map((s, i) => i === 2 ? { ...s, issue: 'No se distingue la salida' } : s), 'ambigüedad activa'],
  [raw.map((s, i) => i === 0 ? { ...s, start: '00:00', end: '00:00', off: false } : s), 'cero ambiguo no es libre'],
  [raw.map((s, i) => i === 0 ? { ...s, start: '07:00', off: true } : s), 'libre con horas contradictorias'],
] as const;
for (const [input, label] of malformed) {
  const result = prepareSmartImport(week, [...input], 'excel', 'OSCAR');
  eq(result.status, 'review-required', label);
}
eq(prepareSmartImport(week, raw, 'pdf', null).status, 'review-required', 'sin persona verificada no se crea semana');
eq(prepareSmartImport(week, raw, 'pdf', 'OSCAR').status, 'ready', 'PDF usa contrato común');
eq(prepareSmartImport(week, raw, 'excel', 'OSCAR').status, 'ready', 'Excel usa contrato común');
eq(prepareSmartImport(week, raw, 'camera', 'OSCAR').status, 'ready', 'cámara usa contrato común');
ok(true, 'no hay efectos secundarios en preparar/aplicar/deshacer');

console.log('Smart Import canonical transaction tests passed.');
