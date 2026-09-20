import {
  DEFAULT_MOVE_PREFERENCES,
  sanitizeMovePreferences,
  type MovePreferences,
} from '../src/move/adaptation';
import {
  resolveMoveTrainingStyle,
  routineForDuration,
  routineExercisePrescription,
} from '../src/move/library';
import { TRAINER_SET_TEMPLATES } from '../src/move/trainerTemplates';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function prefs(
  overrides: Omit<Partial<MovePreferences>, 'equipment'> & { equipment?: Partial<MovePreferences['equipment']> } = {},
): MovePreferences {
  const { equipment, ...rest } = overrides;
  return {
    ...DEFAULT_MOVE_PREFERENCES,
    ...rest,
    equipment: { ...DEFAULT_MOVE_PREFERENCES.equipment, ...equipment },
  };
}

const legacy = sanitizeMovePreferences({ focus: 'fuerza', equipment: {} });
equal(legacy.trainingStyle, 'auto', 'legacy usa Auto');
equal(legacy.equipment.battleRope, false, 'legacy no inventa battle rope');
equal(legacy.equipment.parallelBars, false, 'legacy no inventa paralelas');

const fullyEquippedStrength = prefs({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'avanzado',
  floorAllowed: true,
  chairAvailable: true,
  trainingStyle: 'auto',
  equipment: {
    dumbbellsKg: 10,
    kettlebellKg: 16,
    resistanceBand: true,
    barbellKg: 50,
    bench: true,
    pullupBar: true,
    cableMachine: true,
    gymMachines: true,
    suspensionTrainer: true,
    medicineBallKg: 5,
    jumpRope: true,
    stepBox: true,
    foamRoller: true,
    weightedVestKg: 8,
    battleRope: true,
    parallelBars: true,
  },
});

equal(resolveMoveTrainingStyle(20, fullyEquippedStrength, 'moderada'), 'series', 'Auto fuerza usa series');
const setRoutine = routineForDuration(20, fullyEquippedStrength, 'moderada');
equal(setRoutine.style, 'series', 'rutina de fuerza resuelve a series');
ok(setRoutine.steps.length >= 6, 'series crea múltiples sets');
ok(setRoutine.steps.every((step) => step.mode === 'set'), 'todos los pasos del bloque son sets');
ok(setRoutine.steps.every((step) => Boolean(step.repsLabel)), 'cada set tiene repeticiones');
ok(setRoutine.steps.some((step) => step.restAfterSec === 90), 'series conserva descanso de 1:30 de la fuente');
ok(setRoutine.steps.some((step) => ['5', '6–8', '10', '10–12', '15', '15–20'].includes(step.repsLabel ?? '')), 'usa rangos visibles en las pizarras');
ok(Boolean(routineExercisePrescription(setRoutine, setRoutine.steps[0].exercise.id)), 'preview puede mostrar prescripción');

const forcedIntervals = prefs({
  ...fullyEquippedStrength,
  trainingStyle: 'intervalos',
});
equal(routineForDuration(20, forcedIntervals, 'moderada').style, 'intervalos', 'usuario puede forzar intervalos');

const conditioning = prefs({
  focus: 'activar',
  goal: 'condicion',
  experience: 'avanzado',
  floorAllowed: true,
  trainingStyle: 'auto',
  equipment: {
    dumbbellsKg: 10,
    kettlebellKg: 12,
  },
});
equal(resolveMoveTrainingStyle(20, conditioning, 'alta'), 'amrap', 'Auto condición puede usar AMRAP');
const amrap = routineForDuration(20, conditioning, 'alta');
equal(amrap.style, 'amrap', 'rutina de condición genera AMRAP');
equal(amrap.steps.length, 3, '20 min permite tres rondas de trabajo');
ok(amrap.steps.every((step) => step.mode === 'amrap'), 'pasos AMRAP mantienen modo');
ok(amrap.steps.every((step) => step.durationSec === 300), 'cada ronda usa 5 min de trabajo');
equal(amrap.steps[0].restAfterSec, 120, 'descanso entre rondas es 2 min');
equal(amrap.steps[1].restAfterSec, 120, 'segunda pausa es 2 min');
equal(amrap.steps[2].restAfterSec, 0, 'no obliga descanso al terminar');
ok((amrap.steps[0].circuit?.length ?? 0) >= 3, 'circuito conserva al menos tres ejercicios compatibles');

const excluded = prefs({
  ...conditioning,
  trainingStyle: 'amrap',
  excludedExerciseIds: ['burpee', 'squat-jump', 'jumping-jack'],
});
const excludedAmrap = routineForDuration(20, excluded, 'alta');
if (excludedAmrap.style === 'amrap') {
  ok(
    excludedAmrap.steps.every((step) =>
      (step.circuit ?? []).every((item) => !excluded.excludedExerciseIds.includes(item.exercise.id))),
    'AMRAP respeta exclusiones manuales',
  );
}

const recoveryForcedAmrap = prefs({
  focus: 'movilidad',
  goal: 'movilidad',
  experience: 'avanzado',
  floorAllowed: true,
  trainingStyle: 'amrap',
});
equal(resolveMoveTrainingStyle(20, recoveryForcedAmrap, 'recuperacion'), 'intervalos', 'recuperación bloquea AMRAP exigente');
equal(routineForDuration(20, recoveryForcedAmrap, 'recuperacion').style, 'intervalos', 'recuperación queda en intervalos');

const shortSeries = prefs({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  trainingStyle: 'series',
});
equal(resolveMoveTrainingStyle(5, shortSeries, 'moderada'), 'intervalos', '5 min no fuerza una sesión de series inviable');

const sourceText = JSON.stringify(TRAINER_SET_TEMPLATES);
ok(!sourceText.includes('Benja'), 'plantillas no guardan nombre personal de la pizarra');
ok(!sourceText.includes('Tommy'), 'plantillas no guardan nombre personal de la pizarra');
ok(!sourceText.includes('77.5') && !sourceText.includes('77,5'), 'plantillas no copian RM personal');
ok(TRAINER_SET_TEMPLATES.some((template) => template.items.some((item) => item.reps === '5')), 'fuente conserva 5x5');
ok(TRAINER_SET_TEMPLATES.some((template) => template.items.some((item) => item.reps === '6–8')), 'fuente conserva 4x6–8');
ok(TRAINER_SET_TEMPLATES.some((template) => template.items.some((item) => item.reps === '10/lado')), 'fuente conserva 3x10 por lado');

console.log('Move structured workout regression tests passed.');
