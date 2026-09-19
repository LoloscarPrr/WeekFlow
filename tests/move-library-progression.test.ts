import {
  DEFAULT_MOVE_PREFERENCES,
  sanitizeMovePreferences,
  type MoveEquipmentType,
  type MovePreferences,
} from '../src/move/adaptation';
import {
  MOVE_EXERCISE_BY_ID,
  MOVE_EXERCISE_LIBRARY,
} from '../src/move/exerciseCatalog';
import {
  moveExerciseCompatible,
  routineForDuration,
} from '../src/move/library';
import { moveFeedbackDifficultyDelta } from '../src/move/progression';

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

ok(MOVE_EXERCISE_LIBRARY.length >= 40, 'la biblioteca tiene al menos 40 ejercicios');
equal(new Set(MOVE_EXERCISE_LIBRARY.map((item) => item.id)).size, MOVE_EXERCISE_LIBRARY.length, 'IDs únicos');

for (const exercise of MOVE_EXERCISE_LIBRARY) {
  ok(exercise.family.length > 0, `${exercise.id} tiene familia`);
  ok(exercise.difficulty >= 1 && exercise.difficulty <= 5, `${exercise.id} tiene dificultad 1-5`);
  ok(exercise.pattern.length > 0, `${exercise.id} tiene patrón`);
  ok(!('gender' in exercise), `${exercise.id} no filtra por género`);
  ok(!('bodyType' in exercise), `${exercise.id} no usa somatotipo`);
}

const requiredEquipment: MoveEquipmentType[] = [
  'dumbbells',
  'kettlebell',
  'band',
  'barbell',
  'bench',
  'pullupBar',
  'cable',
  'machine',
  'suspension',
  'medicineBall',
  'jumpRope',
  'stepBox',
  'foamRoller',
  'weightedVest',
];
const catalogEquipment = new Set(MOVE_EXERCISE_LIBRARY.flatMap((exercise) => exercise.equipment ?? []));
for (const equipment of requiredEquipment) {
  ok(catalogEquipment.has(equipment), `la biblioteca cubre ${equipment}`);
}

equal(moveFeedbackDifficultyDelta('Muy fácil'), 1, 'Muy fácil progresa un nivel');
equal(moveFeedbackDifficultyDelta('Bien'), 0, 'Bien mantiene nivel');
equal(moveFeedbackDifficultyDelta('Difícil'), -1, 'Difícil regresa un nivel');
equal(moveFeedbackDifficultyDelta('Demasiado'), -2, 'Demasiado regresa dos niveles');
equal(moveFeedbackDifficultyDelta(null, true), -1, 'terminar antes sin feedback es conservador');

const legacy = sanitizeMovePreferences({
  focus: 'fuerza',
  equipment: { dumbbellsKg: 5, kettlebellKg: 8, resistanceBand: true },
});
equal(legacy.equipment.dumbbellsKg, 5, 'legacy conserva mancuernas');
equal(legacy.equipment.kettlebellKg, 8, 'legacy conserva kettlebell');
equal(legacy.equipment.resistanceBand, true, 'legacy conserva banda');
equal(legacy.equipment.barbellKg, null, 'legacy no inventa barra');
equal(legacy.equipment.bench, false, 'legacy no inventa banco');
equal(legacy.lowImpactOnly, false, 'legacy no activa bajo impacto');

const bodyweightStrength = prefs({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  chairAvailable: true,
  floorAllowed: true,
});

const easyRoutine = routineForDuration(
  10,
  bodyweightStrength,
  'moderada',
  { lastFeedback: 'Muy fácil', previousExerciseIds: ['squat'] },
);
equal(easyRoutine.steps[0].exercise.family, 'squat', 'progresión conserva familia');
ok(easyRoutine.steps[0].exercise.difficulty > MOVE_EXERCISE_BY_ID.squat.difficulty, 'Muy fácil sube dificultad');

const goodRoutine = routineForDuration(
  10,
  bodyweightStrength,
  'moderada',
  { lastFeedback: 'Bien', previousExerciseIds: ['tempo-squat'] },
);
equal(goodRoutine.steps[0].exercise.difficulty, MOVE_EXERCISE_BY_ID['tempo-squat'].difficulty, 'Bien conserva dificultad');

const difficultRoutine = routineForDuration(
  10,
  bodyweightStrength,
  'moderada',
  { lastFeedback: 'Difícil', previousExerciseIds: ['tempo-squat'] },
);
ok(difficultRoutine.steps[0].exercise.difficulty < MOVE_EXERCISE_BY_ID['tempo-squat'].difficulty, 'Difícil baja dificultad');

const tooMuchRoutine = routineForDuration(
  10,
  bodyweightStrength,
  'recuperacion',
  { lastFeedback: 'Demasiado', previousExerciseIds: ['tempo-squat'] },
);
ok(tooMuchRoutine.steps[0].exercise.difficulty <= 1, 'Demasiado busca una regresión clara');

const noEquipment = prefs({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  floorAllowed: true,
  chairAvailable: true,
});
const noEquipmentRoutine = routineForDuration(
  20,
  noEquipment,
  'alta',
  { lastFeedback: 'Muy fácil', previousExerciseIds: ['squat', 'hip-hinge', 'wall-press'] },
);
ok(noEquipmentRoutine.steps.every((step) => !(step.exercise.equipment?.length)), 'progresión no inventa equipo');

const lowImpact = prefs({
  focus: 'activar',
  experience: 'intermedio',
  lowImpactOnly: true,
  equipment: { jumpRope: true, medicineBallKg: 5, stepBox: true },
});
const lowImpactRoutine = routineForDuration(20, lowImpact, 'alta');
ok(lowImpactRoutine.steps.every((step) => step.exercise.impact === 'low'), 'bajo impacto excluye impacto medio/alto');
equal(moveExerciseCompatible(MOVE_EXERCISE_BY_ID['jump-rope-basic'], lowImpact, 'alta'), false, 'cuerda con salto queda filtrada');

const fullyEquipped = prefs({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'avanzado',
  floorAllowed: true,
  chairAvailable: true,
  equipment: {
    dumbbellsKg: 10,
    kettlebellKg: 16,
    resistanceBand: true,
    barbellKg: 40,
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
  },
});
const recovery = routineForDuration(20, fullyEquipped, 'recuperacion', { lastFeedback: 'Demasiado' });
const weightedTypes = new Set<MoveEquipmentType>(['dumbbells', 'kettlebell', 'barbell', 'medicineBall', 'weightedVest']);
ok(
  recovery.steps.every((step) => !(step.exercise.equipment ?? []).some((type) => weightedTypes.has(type))),
  'recuperación no introduce cargas externas exigentes',
);

console.log('Move library and progression regression tests passed.');
