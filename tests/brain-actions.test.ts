import {
  applyBrainAction,
  createBrainActionProposal,
  undoBrainAction,
  type BrainActionState,
  type BrainActionProposal,
} from '../src/brain/actions';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';

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

console.log('Brain action foundation regression tests passed.');
