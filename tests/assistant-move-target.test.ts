import { parseMoveTargetRequest } from '../src/assistant/moveIntent';
import { interpretAssistantText } from '../src/assistant/interpret';
import { DEFAULT_MOVE_PREFERENCES, sanitizeMovePreferences } from '../src/move/adaptation';
import { MOVE_MUSCLE_EXERCISE_IDS } from '../src/move/muscles';
import { compatibleTargetedExercises, routineForDuration } from '../src/move/library';
import { applyBrainAction, undoBrainAction, type BrainActionProposal } from '../src/brain/actions';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message + ': ' + JSON.stringify(actual));
}

equal(parseMoveTargetRequest('Quiero entrenar espalda y bíceps'), ['espalda', 'biceps'], 'combinación de músculos');
equal(parseMoveTargetRequest('Prepárame una rutina de tren superior'), ['pecho', 'espalda', 'hombros', 'biceps', 'triceps'], 'tren superior');
equal(parseMoveTargetRequest('Hazme ejercicios de pierna y glúteos'), ['piernas', 'gluteos'], 'tren inferior');
equal(parseMoveTargetRequest('Quiero entrenar cuerpo completo'), [], 'cuerpo completo explícito');
equal(parseMoveTargetRequest('No quiero entrenar bíceps'), null, 'una negación no programa Move');
equal(parseMoveTargetRequest('Me duele la espalda y quiero ejercicios'), null, 'dolor no prescribe sesiones');
equal(parseMoveTargetRequest('¿Cómo va mi entrenamiento?'), null, 'pregunta no genera acción');
equal(sanitizeMovePreferences({ targetMuscles: ['biceps', 'nonsense', 'biceps', 'espalda'] }).targetMuscles, ['espalda', 'biceps'], 'sanitización estable de grupos');
equal(sanitizeMovePreferences({ focus: 'fuerza' }).targetMuscles, [], 'perfil antiguo sigue como cuerpo completo');

const request = interpretAssistantText('Quiero entrenar espalda y bíceps');
equal(request.status, 'move-target-intent', 'Asistente entiende intención de entrenamiento');
equal(interpretAssistantText('Mañana quiero entrenar espalda').status, 'unsupported', 'no convierte pedido de fecha en objetivo permanente');
equal(interpretAssistantText('Estoy cansado y quiero entrenar piernas').status, 'energy-move-intent', 'Brain reconoce energía y músculos en una solicitud');

const preferences = sanitizeMovePreferences({
  ...DEFAULT_MOVE_PREFERENCES,
  targetMuscles: ['espalda', 'biceps'],
  focus: 'fuerza',
});
const eligible = compatibleTargetedExercises(preferences, 'moderada');
ok(eligible.some((e) => MOVE_MUSCLE_EXERCISE_IDS.espalda.includes(e.id)), 'hay ejercicios de espalda');
ok(eligible.some((e) => MOVE_MUSCLE_EXERCISE_IDS.biceps.includes(e.id)), 'hay alternativa de bíceps sin equipamiento');
const session = routineForDuration(30, preferences, 'moderada');
ok(session.steps.length > 0, 'Move produce pasos de entrenamiento');
ok(session.steps.every((s) => [...MOVE_MUSCLE_EXERCISE_IDS.espalda, ...MOVE_MUSCLE_EXERCISE_IDS.biceps].includes(s.exercise.id)), 'no se cuelan otros músculos');
ok(session.steps.some((s) => s.mode === 'set'), 'con intensidad compatible se generan series');
const banned = { ...preferences, targetMuscles: ['biceps'] as ('biceps')[], avoidAreas: ['wrists'] as ('wrists')[] };
equal(compatibleTargetedExercises(banned, 'moderada').length, 0, 'restricción de muñecas evita todos los curls');

const proposal: BrainActionProposal = {
  id: 'move-target-20261025',
  kind: 'set-move-target',
  title: 'Preparar entrenamiento',
  explanation: 'Enfocar sesión en espalda y bíceps.',
  createdAt: '2026-10-25T15:00:00.000Z',
  requiresConfirmation: true,
  payload: { targetMuscles: ['espalda', 'biceps'], expectedTargetMuscles: [] },
};
const state = { dayState: defaultDayState, weekState: defaultWeekState, movePreferences: DEFAULT_MOVE_PREFERENCES };
equal(applyBrainAction(state, proposal).status, 'confirmation-required', 'sin confirmar no se guarda');
const applied = applyBrainAction(state, proposal, { confirmed: true });
equal(applied.status, 'applied', 'confirmación aplica enfoque');
equal(applied.state.movePreferences?.targetMuscles, ['espalda', 'biceps'], 'se guarda únicamente objetivo Move');
equal(applied.state.weekState, state.weekState, 'Semana no se toca');
ok(applied.receipt?.before.target === 'move-preferences', 'recibo correcto');
const undo = undoBrainAction(applied.state, applied.receipt!);
equal(undo.status, 'reverted', 'undo revierte enfoque');
equal(undo.state.movePreferences?.targetMuscles, [], 'undo restaura objetivo');
const stale = { ...state, movePreferences: { ...state.movePreferences, targetMuscles: ['pecho'] as ('pecho')[] } };
equal(applyBrainAction(stale, proposal, { confirmed: true }).status, 'conflict', 'propuesta obsoleta no pisa cambio posterior');
equal(undoBrainAction({ ...applied.state, movePreferences: stale.movePreferences }, applied.receipt!).status, 'conflict', 'undo no pisa cambios nuevos');
console.log('Assistant Move target tests passed.');
