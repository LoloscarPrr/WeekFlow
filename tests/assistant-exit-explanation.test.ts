import { assessExitReplanImpact } from '../src/brain/exitImpact';
import { buildBrainPlan } from '../src/brain/engine';
import { describeExitImpact } from '../src/assistant/exitExplanation';
import { correctActualExitTime, registerActualExit } from '../src/application/useCases/registerActualExit';
import { defaultDayState } from '../src/domain/defaults';
import type { BrainSnapshot } from '../src/domain/entities/Planning';

function eq<T>(actual: T, expected: T, label: string) {
  if (!Object.is(actual, expected)) throw new Error(label + ': esperaba ' + expected + ', recibí ' + actual);
}
function ok(value: unknown, label: string) { if (!value) throw new Error(label); }

const day: BrainSnapshot = {
  ...defaultDayState.settings,
  energy: 'bien',
  shift: { type: 'afternoon', start: '13:00', end: '22:00' },
};
const plan = buildBrainPlan(day);
const scheduled = new Date(2026, 9, 20, 22, 0);
const lateAt = new Date(2026, 9, 21, 0, 30);
const before = assessExitReplanImpact(day, plan, '00:30', {
  actualExitAt: lateAt,
  scheduledEndAt: scheduled,
});
eq(before.deltaMinutes, 150, 'diurno 13–22 que sale 00:30 debe ser +150, no -1290');
ok(before.requiresConfirmation, 'desfase largo con comida flexible debe requerir revisión');
ok(before.flexibleCount > 0, 'se informa cantidad real de bloques flexibles');
const preview = describeExitImpact('00:30', before, false);
ok(preview.includes('2 h 30 min después'), 'resumen expresa diferencia fechada');
ok(preview.includes('Llegada estimada ' + before.homeAt), 'resumen usa estimación de Brain');
ok(preview.includes('recuperación desde ' + before.recoveryAt), 'resumen usa recuperación de Brain');
ok(preview.includes('Revisarás') && preview.includes('en Ahora'), 'propuesta pide revisión de bloques');
ok(preview.includes('Los compromisos fijos se mantienen'), 'no promete mover lo fijo');

const confirmed = describeExitImpact('00:30', before, true);
ok(confirmed.includes('Falta revisar'), 'tras confirmar se mantiene pendiente real');
ok(!confirmed.includes('se reajustó lo flexible'), 'no afirma una reorganización que aún no se aceptó');
const record = registerActualExit({
  state: defaultDayState,
  shiftKey: '2026-10-20@13:00',
  snapshot: day,
  currentPlan: plan,
  shiftEndAt: scheduled.toISOString(),
  now: lateAt,
});
eq(record.state.actualExit, '00:30', 'se registra hora de salida tras medianoche');
eq(record.requiresConfirmation, true, 'el mismo cálculo con fecha protege la confirmación');

const equalExit = correctActualExitTime({
  state: defaultDayState,
  shiftKey: '2026-10-20@13:00',
  snapshot: day,
  currentPlan: plan,
  shiftEndAt: scheduled.toISOString(),
  time: '00:30',
  referenceAt: lateAt,
});
eq(equalExit.recordedAt.getTime(), lateAt.getTime(), 'salida absoluta se resuelve como fecha real');
eq(equalExit.requiresConfirmation, record.requiresConfirmation, 'salida escrita/Ya salí comparten regla');

const early = assessExitReplanImpact(day, plan, '21:30', {
  actualExitAt: new Date(2026, 9, 20, 21, 30),
  scheduledEndAt: scheduled,
});
eq(early.deltaMinutes, -30, 'salida anterior produce signo negativo');
ok(!early.requiresConfirmation, '30 min antes no requiere aprobación extra');
ok(describeExitImpact('21:30', early, false).includes('30 min antes'), 'texto correcto para adelantado');
ok(describeExitImpact('21:30', early, true).includes('Solo se reajustó'), 'con cambio leve describe reajuste flexible');

const exhausted: BrainSnapshot = { ...day, energy: 'agotado' };
const noFlexible = assessExitReplanImpact(exhausted, buildBrainPlan(exhausted), '00:30', {
  actualExitAt: lateAt,
  scheduledEndAt: scheduled,
});
eq(noFlexible.flexibleCount, 0, 'energía agotada no inventa comida flexible');
eq(noFlexible.requiresConfirmation, false, 'si no hay flexibles no pide confirmación extra');
ok(describeExitImpact('00:30', noFlexible, true).includes('Sin bloques flexibles'), 'explicación respeta plan vacío');

const night: BrainSnapshot = {
  ...defaultDayState.settings,
  energy: 'bien',
  shift: { type: 'night', start: '22:00', end: '06:00' },
};
const overnight = assessExitReplanImpact(night, buildBrainPlan(night), '07:00', {
  actualExitAt: new Date(2026, 9, 21, 7, 0),
  scheduledEndAt: new Date(2026, 9, 21, 6, 0),
});
eq(overnight.deltaMinutes, 60, '22–06 a las 07 es +60');
ok(overnight.affectsRest, 'night-shift protege Rest');
ok(describeExitImpact('07:00', overnight, true).includes('Rest se protege'), 'explicación informa Rest');
eq(assessExitReplanImpact(day, plan, '23:00').deltaMinutes, 60, 'fallback sin fecha no rompe consumidores previos');

console.log('Explainable dated departure regression tests passed.');
