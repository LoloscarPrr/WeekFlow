import { interpretAssistantText } from '../src/assistant/interpret';
import { applyBrainAction, undoBrainAction, receiptHasEffectiveChange, type BrainActionProposal } from '../src/brain/actions';
import { DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import { localDateKey } from '../src/domain/services/shiftSchedule';

function equal(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(label + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  }
}
function ok(value: unknown, label: string) {
  if (!value) throw new Error(label);
}
const now = new Date(2026, 9, 25, 16, 0);
const textCases = [
  'Hoy estoy cansado y quiero entrenar espalda y bíceps',
  'Quiero ejercitar piernas pero estoy agotado',
  'Me siento bien y quiero una rutina de tren superior',
];
for (const phrase of textCases) {
  equal(interpretAssistantText(phrase, now).status, 'energy-move-intent', 'frase combinada: ' + phrase);
}
const intent = interpretAssistantText(textCases[0], now);
if (intent.status !== 'energy-move-intent') throw new Error('faltó interpretación combinada');
equal(intent.energy, 'cansado', 'energía interpretada');
equal(intent.targetMuscles, ['espalda', 'biceps'], 'grupos musculares interpretados');

for (const unsupported of [
  'Mañana trabajo y quiero entrenar espalda, estoy cansado',
  'Estoy cansado y quiero entrenar espalda 45 minutos',
  'No estoy cansado pero quiero entrenar bíceps',
  'Si estoy cansado quiero entrenar brazos',
  'El lunes quiero entrenar piernas y estoy agotado',
]) {
  equal(interpretAssistantText(unsupported, now).status, 'unsupported', 'frase fuera de alcance debe rechazarse: ' + unsupported);
}
equal(interpretAssistantText('Estoy cansado', now).status, 'proposal', 'energía sola sigue funcionando');
equal(interpretAssistantText('Quiero entrenar espalda', now).status, 'move-target-intent', 'Move solo sigue funcionando');
equal(interpretAssistantText('no estoy cansado', now).status, 'unsupported', 'negación de energía no se registra');

const initial = {
  dayState: { ...defaultDayState },
  weekState: defaultWeekState,
  movePreferences: { ...DEFAULT_MOVE_PREFERENCES, targetMuscles: [] },
};
const proposal: BrainActionProposal = {
  id: 'combined-20261025',
  kind: 'set-energy-move',
  title: 'Ajustar energía y entrenamiento',
  explanation: 'Hoy estás cansado y quieres entrenar espalda y bíceps.',
  createdAt: now.toISOString(),
  requiresConfirmation: true,
  payload: {
    energy: 'cansado',
    targetMuscles: ['espalda', 'biceps'],
    dayKey: localDateKey(now),
    expectedDayState: initial.dayState,
    expectedMovePreferences: initial.movePreferences,
  },
};
const blocked = applyBrainAction(initial, proposal, { now });
equal(blocked.status, 'confirmation-required', 'sin confirmación no aplica nada');
equal(blocked.state.dayState, initial.dayState, 'sin confirmar no cambia energía');
equal(blocked.state.movePreferences, initial.movePreferences, 'sin confirmar no cambia Move');

const confirmed = applyBrainAction(initial, proposal, { now, confirmed: true });
equal(confirmed.status, 'applied', 'confirma los dos cambios');
equal(confirmed.state.dayState.energy, 'cansado', 'energía nueva');
equal(confirmed.state.movePreferences?.targetMuscles, ['espalda', 'biceps'], 'grupo nuevo');
equal(confirmed.state.weekState, initial.weekState, 'Semana no se modifica');
equal(confirmed.receipt?.before.target, 'day-move', 'recibo conjunto');
ok(confirmed.receipt && receiptHasEffectiveChange(confirmed.receipt), 'recibo permite undo');

const undone = undoBrainAction(confirmed.state, confirmed.receipt!);
equal(undone.status, 'reverted', 'undo ambos en un solo paso');
equal(undone.state.dayState, initial.dayState, 'undo recupera energía');
equal(undone.state.movePreferences, initial.movePreferences, 'undo recupera Move');

const changedDay = { ...initial, dayState: { ...initial.dayState, energy: 'agotado' as const } };
equal(applyBrainAction(changedDay, proposal, { now, confirmed: true }).status, 'conflict', 'bloquea energía alterada');
const changedPreferences = { ...initial, movePreferences: { ...initial.movePreferences, chairAvailable: false } };
equal(applyBrainAction(changedPreferences, proposal, { now, confirmed: true }).status, 'conflict', 'bloquea perfil alterado');
equal(applyBrainAction(initial, proposal, { now: new Date(2026, 9, 26, 0, 1), confirmed: true }).status, 'conflict', 'cambio de día bloqueado');
equal(undoBrainAction({ ...confirmed.state, movePreferences: changedPreferences.movePreferences }, confirmed.receipt!).status, 'conflict', 'undo nunca pisa preferencias posteriores');
equal(undoBrainAction({ ...confirmed.state, dayState: changedDay.dayState }, confirmed.receipt!).status, 'conflict', 'undo nunca pisa energía posterior');
console.log('Combined Brain Energy+Move tests passed.');
