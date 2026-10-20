import {
  applyBrainAction,
  createBrainActionProposal,
  undoBrainAction,
  receiptHasEffectiveChange,
  type BrainActionState,
  type BrainActionProposal,
} from '../src/brain/actions';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import { buildBrainPlan } from '../src/brain/engine';
import type { BrainSnapshot } from '../src/domain/entities/Planning';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function initialState(): BrainActionState {
  return {
    dayState: { ...defaultDayState },
    weekState: {
      ...defaultWeekState,
      shifts: defaultWeekState.shifts.map((shift) => ({ ...shift })),
      importantMoments: [...defaultWeekState.importantMoments],
    },
  };
}

const energyProposal: BrainActionProposal = createBrainActionProposal({
  id: 'energy-2026-10-08',
  kind: 'set-energy',
  title: 'Bajar intensidad del día',
  explanation: 'Dijiste que hoy llegas con poca energía.',
  createdAt: '2026-10-08T12:00:00.000Z',
  requiresConfirmation: true,
  payload: { energy: 'cansado' },
});

const beforeEnergy = initialState();
const blocked = applyBrainAction(beforeEnergy, energyProposal, { confirmed: false });
equal(blocked.status, 'confirmation-required', 'acción confirmable debe esperar');
equal(blocked.state.dayState.energy, 'bien', 'sin confirmación no cambia energía');
equal(blocked.receipt, null, 'sin confirmación no genera recibo');

const applied = applyBrainAction(beforeEnergy, energyProposal, {
  confirmed: true,
  now: new Date('2026-10-08T12:01:00.000Z'),
});
equal(applied.status, 'applied', 'acción confirmada se aplica');
equal(applied.state.dayState.energy, 'cansado', 'set-energy usa el estado real');
ok(applied.receipt, 'acción aplicada genera recibo');
equal(applied.receipt?.appliedAt, '2026-10-08T12:01:00.000Z', 'recibo registra timestamp');
equal(applied.receipt?.before.target, 'day-state', 'recibo identifica target');
equal(applied.receipt?.after.target, 'day-state', 'recibo identifica target final');
ok(receiptHasEffectiveChange(applied.receipt!), 'el cambio de energía debe ofrecer undo');

const reverted = undoBrainAction(applied.state, applied.receipt!);
equal(reverted.status, 'reverted', 'undo válido revierte');
equal(reverted.state.dayState.energy, 'bien', 'undo recupera energía anterior');

const changedLater: BrainActionState = {
  ...applied.state,
  dayState: { ...applied.state.dayState, energy: 'agotado' },
};
const conflict = undoBrainAction(changedLater, applied.receipt!);
equal(conflict.status, 'conflict', 'undo detecta cambios posteriores');
equal(conflict.state.dayState.energy, 'agotado', 'conflicto no pisa estado nuevo');

const shiftProposal: BrainActionProposal = createBrainActionProposal({
  id: 'shift-monday-later',
  kind: 'update-week-shift',
  title: 'Mover entrada del lunes',
  explanation: 'La entrada confirmada cambió y Semana debe reflejar la realidad.',
  createdAt: '2026-10-08T12:05:00.000Z',
  requiresConfirmation: true,
  payload: {
    day: 0,
    patch: { start: '10:00', end: '18:00' },
  },
});

const weekApplied = applyBrainAction(initialState(), shiftProposal, { confirmed: true });
equal(weekApplied.status, 'applied', 'cambio de turno se aplica');
equal(weekApplied.state.weekState.shifts[0].start, '10:00', 'turno actualiza entrada');
equal(weekApplied.state.weekState.shifts[0].end, '18:00', 'turno actualiza salida');
equal(weekApplied.state.weekState.shifts[0].type, 'morning', 'turno conserva clasificación del use case');
equal(weekApplied.state.weekState.source, 'manual', 'cambio de turno usa semántica Week existente');
ok(receiptHasEffectiveChange(weekApplied.receipt!), 'el cambio de horario debe ofrecer undo');
const weekReverted = undoBrainAction(weekApplied.state, weekApplied.receipt!);
equal(weekReverted.status, 'reverted', 'undo de Semana revierte turno confirmado');
equal(weekReverted.state.weekState.shifts[0].start, initialState().weekState.shifts[0].start, 'horario previo restaurado');

const laterWeek = {
  ...weekApplied.state,
  weekState: {
    ...weekApplied.state.weekState,
    shifts: weekApplied.state.weekState.shifts.map((shift, index) => index === 0 ? { ...shift, start: '11:00' } : shift),
  },
};
const weekConflict = undoBrainAction(laterWeek, weekApplied.receipt!);
equal(weekConflict.status, 'conflict', 'no revierte Semana modificada posteriormente');
equal(weekConflict.state.weekState.shifts[0].start, '11:00', 'respeta un cambio posterior de Semana');

const noOpProposal: BrainActionProposal = {
  id: 'energy-noop',
  kind: 'set-energy',
  title: 'Mantener energía del día',
  explanation: 'La energía registrada ya coincide con la propuesta.',
  createdAt: '2026-10-08T12:10:00.000Z',
  requiresConfirmation: true,
  payload: { energy: 'bien' },
};
const noOp = applyBrainAction(initialState(), noOpProposal, { confirmed: true });
equal(noOp.status, 'applied', 'no-op sigue siendo aplicación válida');
equal(noOp.message, 'El estado ya estaba como proponía WeekFlow.', 'no-op se explica');
ok(noOp.receipt && !receiptHasEffectiveChange(noOp.receipt), 'no-op no debe ofrecer undo redundante');

let invalidDayRejected = false;
try {
  createBrainActionProposal({
    id: 'invalid-day',
    kind: 'update-week-shift',
    title: 'Turno inválido',
    explanation: 'Esta propuesta debe rechazarse por día fuera de rango.',
    createdAt: '2026-10-08T12:15:00.000Z',
    requiresConfirmation: true,
    payload: { day: 9, patch: { start: '09:00' } },
  });
} catch {
  invalidDayRejected = true;
}
ok(invalidDayRejected, 'día inválido se rechaza');

// A real exit must use the same Now use case and never rewrite the planned Week shift.
const actualExitNow = new Date(2026, 9, 5, 23, 35);
const snapshot: BrainSnapshot = {
  ...defaultDayState.settings,
  energy: 'bien',
  shift: { start: '13:00', end: '22:00', type: 'afternoon' },
};
const exitContext = {
  shiftKey: '2026-10-05@13:00',
  shiftStartAt: new Date(2026, 9, 5, 13, 0).toISOString(),
  snapshot,
  currentPlan: buildBrainPlan(snapshot),
  phase: 'after' as const,
};
const exitProposal: BrainActionProposal = createBrainActionProposal({
  id: 'assistant-real-exit',
  kind: 'record-actual-exit',
  title: 'Registrar salida real',
  explanation: 'Salí después de lo previsto.',
  createdAt: actualExitNow.toISOString(),
  requiresConfirmation: true,
  payload: { time: '23:30', shiftKey: exitContext.shiftKey, plannedEnd: '22:00' },
});
if (exitProposal.kind !== 'record-actual-exit') throw new Error('Expected real-exit proposal fixture');
const start = initialState();
const exitWithoutConfirmation = applyBrainAction(start, exitProposal, { now: actualExitNow, actualExitContext: exitContext });
equal(exitWithoutConfirmation.status, 'confirmation-required', 'salida real no se registra sin confirmar');
equal(exitWithoutConfirmation.state.dayState.actualExit, start.dayState.actualExit, 'sin confirmar no cambia DayState');
const actualExitApplied = applyBrainAction(start, exitProposal, {
  confirmed: true, now: actualExitNow, actualExitContext: exitContext,
});
equal(actualExitApplied.status, 'applied', 'salida real se confirma');
equal(actualExitApplied.state.dayState.actualExit, '23:30', 'hora real guardada mediante caso de uso de Ahora');
equal(actualExitApplied.state.dayState.actualExitShiftKey, exitContext.shiftKey, 'salida queda vinculada a la jornada correcta');
ok(Boolean(actualExitApplied.state.dayState.actualExitAt), 'se guarda fecha de salida real');
equal(actualExitApplied.state.weekState, start.weekState, 'salida real no altera Semana programada');
ok(actualExitApplied.receipt && receiptHasEffectiveChange(actualExitApplied.receipt), 'salida confirmada puede deshacerse');
const actualExitUndone = undoBrainAction(actualExitApplied.state, actualExitApplied.receipt!);
equal(actualExitUndone.status, 'reverted', 'salida real se puede deshacer');
equal(actualExitUndone.state.dayState.actualExit, start.dayState.actualExit, 'undo repone DayState original');

const changedShiftContext = {
  ...exitContext,
  snapshot: { ...snapshot, shift: { ...snapshot.shift, end: '23:00' } },
};
const staleExit = applyBrainAction(start, exitProposal, {
  confirmed: true, now: actualExitNow, actualExitContext: changedShiftContext,
});
equal(staleExit.status, 'conflict', 'si cambia la salida planificada, se descarta propuesta');
equal(staleExit.state, start, 'conflicto no modifica estado');

const offExit = applyBrainAction(start, exitProposal, {
  confirmed: true, now: actualExitNow,
  actualExitContext: { ...exitContext, phase: 'off' },
});
equal(offExit.status, 'conflict', 'no se registran salidas reales en día libre');
const beforeExit = applyBrainAction(start, exitProposal, {
  confirmed: true, now: actualExitNow,
  actualExitContext: { ...exitContext, phase: 'before' },
});
equal(beforeExit.status, 'conflict', 'no se registra salida antes de trabajar');
const beforeShiftTime: BrainActionProposal = {
  ...exitProposal,
  payload: { ...exitProposal.payload, time: '10:00' },
};
const impossibleEarlyExit = applyBrainAction(start, beforeShiftTime, {
  confirmed: true, now: actualExitNow, actualExitContext: exitContext,
});
equal(impossibleEarlyExit.status, 'conflict', 'no registra hora real anterior al inicio del turno');
equal(impossibleEarlyExit.state, start, 'la salida inválida conserva DayState');

const futureExit: BrainActionProposal = {
  ...exitProposal,
  payload: { ...exitProposal.payload, time: '23:55' },
};
const futureResult = applyBrainAction(start, futureExit, {
  confirmed: true, now: actualExitNow, actualExitContext: exitContext,
});
equal(futureResult.status, 'conflict', 'no registra salida que aún no ocurrió');
equal(futureResult.state, start, 'hora futura no escribe estado');


const changedAfterExit: BrainActionState = {
  ...actualExitApplied.state,
  dayState: { ...actualExitApplied.state.dayState, actualExitReplanConfirmed: true },
};
const actualExitConflict = undoBrainAction(changedAfterExit, actualExitApplied.receipt!);
equal(actualExitConflict.status, 'conflict', 'undo no debe borrar una confirmación posterior en Ahora');
equal(actualExitConflict.state.dayState.actualExit, '23:30', 'conflicto de undo conserva la salida real');

// Overnight: exit at 06:10 belongs to the shift started yesterday at 22:00.
const nightNow = new Date(2026, 9, 6, 6, 15);
const nightSnapshot: BrainSnapshot = {
  ...defaultDayState.settings,
  energy: 'bien',
  shift: { start: '22:00', end: '06:00', type: 'night' },
};
const nightContext = {
  shiftKey: '2026-10-05@22:00',
  shiftStartAt: new Date(2026, 9, 5, 22, 0).toISOString(),
  snapshot: nightSnapshot,
  currentPlan: buildBrainPlan(nightSnapshot),
  phase: 'after' as const,
};
const nightProposal: BrainActionProposal = {
  id: 'assistant-night-exit',
  kind: 'record-actual-exit',
  title: 'Salida nocturna real',
  explanation: 'Salí después de medianoche.',
  createdAt: nightNow.toISOString(),
  requiresConfirmation: true,
  payload: { time: '06:10', shiftKey: nightContext.shiftKey, plannedEnd: '06:00' },
};
const previousExit = {
  ...initialState(),
  dayState: {
    ...defaultDayState,
    actualExit: '21:00',
    actualExitAt: new Date(2026, 9, 4, 21).toISOString(),
    actualExitShiftKey: '2026-10-04@13:00',
  },
};
const nightResult = applyBrainAction(previousExit, nightProposal, {
  confirmed: true, now: nightNow, actualExitContext: nightContext,
});
equal(nightResult.status, 'applied', 'turno nocturno permite salida real al cruzar medianoche');
equal(nightResult.state.dayState.actualExit, '06:10', 'hora nocturna guardada');
equal(new Date(nightResult.state.dayState.actualExitAt!).getDate(), 6, 'usa la jornada actual aunque exista salida previa guardada');
equal(nightResult.state.dayState.actualExitShiftKey, nightContext.shiftKey, 'conserva identidad del turno nocturno');

console.log('Brain action foundation regression tests passed.');
