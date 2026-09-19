import {
  DEFAULT_MOVE_PREFERENCES,
  declaredExternalLoadRatio,
  recommendMoveIntensity,
  recommendMoveMinutes,
  sanitizeMovePreferences,
  type MovePreferences,
} from '../src/move/adaptation';
import {
  alternateExercise,
  moveExerciseEquipmentLabel,
  previewForDuration,
  routineForDuration,
} from '../src/move/library';
import type { Shift } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function preferences(
  overrides: Omit<Partial<MovePreferences>, 'equipment'> & { equipment?: Partial<MovePreferences['equipment']> } = {},
): MovePreferences {
  const { equipment, ...rest } = overrides;
  return {
    ...DEFAULT_MOVE_PREFERENCES,
    ...rest,
    equipment: { ...DEFAULT_MOVE_PREFERENCES.equipment, ...equipment },
  };
}

const workShift: Shift = { start: '07:00', end: '17:30', type: 'morning', breakMinutes: 30 };
const offShift: Shift = { start: '', end: '', type: 'off', breakMinutes: 0 };

equal(recommendMoveMinutes('bien', null, offShift), 20, 'bien en día libre');
equal(recommendMoveMinutes('cansado', null, workShift), 10, 'cansado en jornada');
equal(recommendMoveMinutes('vigoroso', 'Difícil', offShift), 20, 'feedback difícil reduce duración');
equal(recommendMoveMinutes('vigoroso', 'Demasiado', offShift), 10, 'feedback demasiado reduce más');
equal(recommendMoveMinutes('bien', null, offShift, true), 10, 'terminar antes reduce la siguiente propuesta sin castigo');

equal(recommendMoveIntensity('agotado', 'avanzado', null), 'recuperacion', 'agotado usa recuperación');
equal(recommendMoveIntensity('cansado', 'avanzado', null), 'suave', 'cansado usa intensidad suave');
equal(recommendMoveIntensity('bien', 'intermedio', null), 'moderada', 'bien usa intensidad moderada');
equal(recommendMoveIntensity('vigoroso', 'principiante', null), 'moderada', 'principiante vigoroso no salta a intensidad alta');
equal(recommendMoveIntensity('vigoroso', 'intermedio', null), 'alta', 'intermedio vigoroso puede usar intensidad alta');
equal(recommendMoveIntensity('vigoroso', 'avanzado', 'Difícil'), 'moderada', 'feedback difícil baja un nivel de intensidad');
equal(recommendMoveIntensity('vigoroso', 'avanzado', 'Demasiado'), 'recuperacion', 'feedback demasiado baja claramente la intensidad');

const densityPrefs = preferences({ focus: 'equilibrado', experience: 'intermedio' });
const recoveryRoutine = routineForDuration(10, densityPrefs, 'recuperacion');
const highRoutine = routineForDuration(10, densityPrefs, 'alta');
equal(recoveryRoutine.totalSeconds, 600, 'recuperación conserva 10 minutos exactos');
equal(highRoutine.totalSeconds, 600, 'intensidad alta conserva 10 minutos exactos');
ok(recoveryRoutine.steps[0].restAfterSec > highRoutine.steps[0].restAfterSec, 'recuperación deja más descanso que intensidad alta');
ok(recoveryRoutine.steps[0].durationSec < highRoutine.steps[0].durationSec, 'recuperación reduce el tiempo relativo de trabajo');

const standing = preferences({ focus: 'fuerza', floorAllowed: false, chairAvailable: false });
const standingRoutine = routineForDuration(10, standing);
equal(standingRoutine.totalSeconds, 600, 'rutina de pie dura 10 minutos');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'floor'), 'sin ejercicios de suelo cuando están desactivados');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'chair'), 'sin silla cuando no está disponible');
ok(standingRoutine.steps.every((step) => !(step.exercise.equipment?.length)), 'sin equipo declarado no aparecen ejercicios con equipo');

const strengthPreview = previewForDuration(10, standing);
ok(strengthPreview.some((exercise) => ['squat', 'wall-sit', 'hip-hinge', 'wall-press'].includes(exercise.id)), 'preview de fuerza contiene fuerza general real');
ok(!['shoulders', 'reach'].includes(strengthPreview[0]?.id ?? ''), 'fuerza no empieza con movilidad pura');

const floorStrength = preferences({ focus: 'fuerza', floorAllowed: true, chairAvailable: true });
const floorRoutine = routineForDuration(20, floorStrength);
equal(floorRoutine.totalSeconds, 1200, 'rutina fuerza dura 20 minutos');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'floor'), 'fuerza puede usar suelo si está permitido');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'chair'), 'fuerza puede usar silla si está disponible');

const activation = preferences({ focus: 'activar', floorAllowed: false, chairAvailable: false });
const activationPreview = previewForDuration(10, activation);
ok(activationPreview.some((exercise) => ['march', 'side-step', 'squat-reach', 'knee-lift', 'reverse-lunge'].includes(exercise.id)), 'activar usa movimiento dinámico');

const beginnerActivation = preferences({ focus: 'activar', floorAllowed: false, chairAvailable: false, experience: 'principiante' });
const beginnerRoutine = routineForDuration(10, beginnerActivation);
ok(beginnerRoutine.steps.every((step) => step.exercise.id !== 'reverse-lunge'), 'principiante no recibe zancada marcada intermedia');

const mobility = preferences({ focus: 'movilidad', floorAllowed: false, chairAvailable: false });
const mobilityRoutine = routineForDuration(5, mobility);
equal(mobilityRoutine.totalSeconds, 300, 'movilidad dura 5 minutos');
equal(mobilityRoutine.steps.at(-1)?.exercise.id, 'breathing', 'movilidad cierra con respiración');
const mobilityPreview = previewForDuration(10, mobility);
ok(mobilityPreview.some((exercise) => ['shoulders', 'reach', 'calf-release'].includes(exercise.id)), 'movilidad conserva movimientos suaves');
ok(activationPreview.map((item) => item.id).join(',') !== mobilityPreview.map((item) => item.id).join(','), 'activar y movilidad producen previews distintas');

const conditioningGoal = preferences({ focus: 'equilibrado', goal: 'condicion' });
const mobilityGoal = preferences({ focus: 'equilibrado', goal: 'movilidad' });
const conditioningPreview = previewForDuration(10, conditioningGoal);
const mobilityGoalPreview = previewForDuration(10, mobilityGoal);
ok(['march', 'side-step', 'knee-lift', 'squat-reach'].includes(conditioningPreview[0]?.id ?? ''), 'objetivo condición adelanta movimiento continuo en equilibrado');
ok(['shoulders', 'reach', 'calf-release', 'toe-tap'].includes(mobilityGoalPreview[0]?.id ?? ''), 'objetivo movilidad adelanta movilidad en equilibrado');

const equipped = preferences({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  weightKg: 80,
  equipment: { dumbbellsKg: 10, kettlebellKg: 12, resistanceBand: true },
});
const equippedPreview = previewForDuration(20, equipped, 'alta');
ok(equippedPreview.some((exercise) => Boolean(exercise.equipment?.length)), 'equipo registrado habilita ejercicios con equipo');
const loadedPreviewExercise = equippedPreview.find((exercise) => Boolean(exercise.equipment?.length));
ok(loadedPreviewExercise && moveExerciseEquipmentLabel(loadedPreviewExercise, equipped)?.includes('kg'), 'la preview puede mostrar la carga registrada');
const softEquipped = preferences({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  weightKg: 80,
  equipment: { dumbbellsKg: 5, kettlebellKg: 8, resistanceBand: false },
});
const softStrengthRoutine = routineForDuration(10, softEquipped, 'suave');
const softLoadedSteps = softStrengthRoutine.steps.filter((step) => Boolean(step.exercise.equipment?.length));
ok(softLoadedSteps.length >= 1, 'fuerza suave conserva al menos una variante con carga declarada');
equal(softLoadedSteps.length, 1, 'fuerza suave limita la carga priorizada a un bloque en 10 minutos');
ok(['dumbbells', 'kettlebell'].some((type) => softLoadedSteps[0]?.exercise.equipment?.includes(type as any)), 'la carga suave usa equipo realmente declarado');

const recoveryWithEquipment = routineForDuration(20, equipped, 'recuperacion');
ok(recoveryWithEquipment.steps.every((step) => !(step.exercise.equipment?.length)), 'recuperación no prioriza ni incluye cargas externas');

const lightRelativeLoad = preferences({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  weightKg: 100,
  equipment: { dumbbellsKg: 5 },
});
const substantialRelativeLoad = preferences({
  focus: 'fuerza',
  goal: 'fuerza',
  experience: 'intermedio',
  weightKg: 50,
  equipment: { dumbbellsKg: 20 },
});
ok((declaredExternalLoadRatio(lightRelativeLoad) ?? 0) < (declaredExternalLoadRatio(substantialRelativeLoad) ?? 0), 'peso corporal contextualiza la carga externa declarada');
const lightLoadedCount = routineForDuration(20, lightRelativeLoad, 'alta').steps.filter((step) => Boolean(step.exercise.equipment?.length)).length;
const substantialLoadedCount = routineForDuration(20, substantialRelativeLoad, 'alta').steps.filter((step) => Boolean(step.exercise.equipment?.length)).length;
ok(lightLoadedCount > substantialLoadedCount, 'una carga externa relativamente mayor se prioriza menos veces sin clasificar el cuerpo');

const avoidKnees = preferences({ focus: 'activar', floorAllowed: false, chairAvailable: true, avoidAreas: ['knees'] });
const kneesRoutine = routineForDuration(10, avoidKnees);
ok(kneesRoutine.steps.every((step) => !step.exercise.areas.includes('knees')), 'rodillas evitadas no aparecen en la rutina');
equal(kneesRoutine.totalSeconds, 600, 'filtrar rodillas mantiene la duración objetivo');

const avoidUpper = preferences({ focus: 'fuerza', floorAllowed: true, chairAvailable: true, avoidAreas: ['shoulders', 'wrists'] });
const upperRoutine = routineForDuration(20, avoidUpper);
ok(upperRoutine.steps.every((step) => !step.exercise.areas.includes('shoulders')), 'hombros evitados no aparecen en la rutina');
ok(upperRoutine.steps.every((step) => !step.exercise.areas.includes('wrists')), 'muñecas evitadas no aparecen en la rutina');
const swapped = alternateExercise({
  id: 'test', icon: '•', title: 'Test', cue: '', easier: '', swapWith: 'incline-push', needs: 'none', focus: ['fuerza'], areas: [],
}, avoidUpper);
ok(!swapped.areas.includes('shoulders') && !swapped.areas.includes('wrists'), 'cambiar ejercicio respeta zonas evitadas');

const noEquipmentSwap = alternateExercise({
  id: 'test-equipment', icon: '•', title: 'Test', cue: '', easier: '', swapWith: 'db-goblet-squat', needs: 'none', focus: ['fuerza'], areas: [],
}, standing);
ok(!(noEquipmentSwap.equipment?.length), 'cambiar ejercicio no introduce equipo ausente');

const allAvoided = preferences({ focus: 'equilibrado', floorAllowed: true, chairAvailable: true, avoidAreas: ['shoulders', 'knees', 'wrists', 'lowerBack'] });
const constrainedRoutine = routineForDuration(5, allAvoided);
ok(constrainedRoutine.steps.every((step) => step.exercise.areas.every((area) => !allAvoided.avoidAreas.includes(area))), 'fallback nunca reintroduce una zona bloqueada');
equal(constrainedRoutine.steps.at(-1)?.exercise.id, 'breathing', 'cierre respiratorio sigue disponible con todas las zonas marcadas');

const legacy = sanitizeMovePreferences({ focus: 'movilidad', floorAllowed: true, chairAvailable: false });
equal(legacy.avoidAreas.length, 0, 'preferencias antiguas cargan sin zonas evitadas');
equal(legacy.experience, 'sin_definir', 'preferencias antiguas cargan experiencia neutral');
equal(legacy.goal, 'bienestar', 'preferencias antiguas cargan objetivo seguro');
equal(legacy.equipment.dumbbellsKg, null, 'preferencias antiguas no inventan mancuernas');
equal(legacy.equipment.kettlebellKg, null, 'preferencias antiguas no inventan kettlebell');
equal(legacy.equipment.resistanceBand, false, 'preferencias antiguas no inventan banda');

const sanitized = sanitizeMovePreferences({
  focus: 'fuerza',
  floorAllowed: true,
  chairAvailable: true,
  avoidAreas: ['knees', 'knees', 'unknown'],
  experience: 'intermedio',
  goal: 'musculo',
  weightKg: 80,
  heightCm: 175,
  equipment: { dumbbellsKg: 10, kettlebellKg: 16, resistanceBand: true },
});
equal(sanitized.avoidAreas.length, 1, 'sanitización deduplica e ignora zonas desconocidas');
equal(sanitized.avoidAreas[0], 'knees', 'sanitización conserva una zona válida');
equal(sanitized.weightKg, 80, 'sanitización conserva peso válido');
equal(sanitized.equipment.dumbbellsKg, 10, 'sanitización conserva carga válida');

const invalidNumbers = sanitizeMovePreferences({
  weightKg: -4,
  heightCm: 9999,
  equipment: { dumbbellsKg: 0, kettlebellKg: Number.NaN, resistanceBand: false },
});
equal(invalidNumbers.weightKg, null, 'peso inválido se normaliza a null');
equal(invalidNumbers.heightCm, null, 'altura inválida se normaliza a null');
equal(invalidNumbers.equipment.dumbbellsKg, null, 'carga inválida se normaliza a null');
equal(invalidNumbers.equipment.kettlebellKg, null, 'NaN se normaliza a null');

console.log('Move adaptation regression tests passed.');
