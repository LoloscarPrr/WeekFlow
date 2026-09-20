import {
  DEFAULT_MOVE_PREFERENCES,
  MOVE_EXPERIENCE_RANK,
  MOVE_INTENSITY_RANK,
  declaredExternalLoadRatio,
  moveEquipmentAvailable,
  moveEquipmentLabel,
  type MoveIntensity,
  type MovePreferences,
} from './adaptation';
import {
  MOVE_EXERCISE_BY_ID,
  MOVE_EXERCISE_LIBRARY,
  type MoveExercise,
} from './exerciseCatalog';
import {
  clampMoveDifficulty,
  moveFeedbackDifficultyDelta,
  type MoveProgressionContext,
} from './progression';

export type { MoveExercise, MovePattern, MoveImpact } from './exerciseCatalog';

export type MoveStep = {
  slot: number;
  exercise: MoveExercise;
  durationSec: number;
  restAfterSec: number;
};

export type MoveRoutine = {
  id: string;
  targetMinutes: number;
  intensity: MoveIntensity;
  steps: MoveStep[];
  totalSeconds: number;
};

const FOCUS_ORDER: Record<MovePreferences['focus'], string[]> = {
  equilibrado: [
    'march',
    'squat',
    'wall-press',
    'band-row',
    'hip-hinge',
    'dead-bug',
    'side-step',
    'supported-split-squat',
    'reach',
    'calf-release',
    'breathing',
  ],
  activar: [
    'march',
    'side-step',
    'squat-reach',
    'knee-lift',
    'step-up',
    'reverse-lunge',
    'toe-tap',
    'march',
    'side-step',
    'calf-release',
    'breathing',
  ],
  fuerza: [
    'squat',
    'hip-hinge',
    'wall-press',
    'band-row',
    'supported-split-squat',
    'dead-bug',
    'incline-push',
    'bridge',
    'plank-knees',
    'heel-raise',
    'breathing',
  ],
  movilidad: [
    'shoulders',
    'reach',
    'calf-release',
    'cat-cow',
    'thoracic-rotation',
    'hip-flexor-stretch',
    'toe-tap',
    'breathing',
  ],
};

const LOADED_ORDER = [
  'db-goblet-squat',
  'kb-deadlift',
  'band-row',
  'db-rdl',
  'cable-row',
  'machine-chest-press',
  'db-floor-press',
  'barbell-rdl',
  'medicine-ball-slam',
  'weighted-vest-march',
];

const CONDITIONING_PREFIX = ['march', 'side-step', 'knee-lift', 'squat-reach'];
const MOBILITY_PREFIX = ['shoulders', 'reach', 'calf-release', 'cat-cow'];
const SAFE_FALLBACK_ORDER = ['breathing', 'calf-release', 'march'];
const STEP_COUNT: Record<number, number> = { 5: 5, 10: 9, 20: 16, 30: 22 };

function supportedDuration(value: number) {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  return 30;
}

function experienceCompatible(exercise: MoveExercise, preferences: MovePreferences) {
  if (!exercise.minExperience) return true;
  if (preferences.experience === 'sin_definir') return false;
  return MOVE_EXPERIENCE_RANK[preferences.experience] >= MOVE_EXPERIENCE_RANK[exercise.minExperience];
}

function intensityCompatible(exercise: MoveExercise, intensity: MoveIntensity) {
  if (!exercise.minIntensity) return true;
  return MOVE_INTENSITY_RANK[intensity] >= MOVE_INTENSITY_RANK[exercise.minIntensity];
}

export function moveExerciseProfileCompatible(
  exercise: MoveExercise,
  preferences: MovePreferences,
  intensity: MoveIntensity = 'moderada',
) {
  if (exercise.needs === 'floor' && !preferences.floorAllowed) return false;
  if (exercise.needs === 'chair' && !preferences.chairAvailable) return false;
  if (exercise.areas.some((area) => preferences.avoidAreas.includes(area))) return false;
  if (preferences.lowImpactOnly && exercise.impact !== 'low') return false;
  if (!experienceCompatible(exercise, preferences)) return false;
  if (!intensityCompatible(exercise, intensity)) return false;
  if ((exercise.equipment ?? []).some((item) => !moveEquipmentAvailable(item, preferences))) return false;
  return true;
}

export function moveExerciseCompatible(
  exercise: MoveExercise,
  preferences: MovePreferences,
  intensity: MoveIntensity = 'moderada',
) {
  if (!moveExerciseProfileCompatible(exercise, preferences, intensity)) return false;
  return !preferences.excludedExerciseIds.includes(exercise.id);
}

const REST_FALLBACK: MoveExercise = {
  id: 'move-rest-fallback',
  icon: '😌',
  title: 'Pausa activa',
  cue: 'Respira cómodo y haz movimientos suaves a tu ritmo.',
  easier: 'Quédate quieto y respira naturalmente.',
  swapWith: '',
  needs: 'none',
  focus: ['equilibrado', 'activar', 'fuerza', 'movilidad'],
  areas: [],
  pattern: 'mobility',
  family: 'recovery-fallback',
  difficulty: 1,
  impact: 'low',
};

function firstSafeFallback(preferences: MovePreferences, intensity: MoveIntensity) {
  for (const id of SAFE_FALLBACK_ORDER) {
    const exercise = MOVE_EXERCISE_BY_ID[id];
    if (exercise && moveExerciseCompatible(exercise, preferences, intensity)) return exercise;
  }
  const anyCompatible = MOVE_EXERCISE_LIBRARY.find((exercise) => moveExerciseCompatible(exercise, preferences, intensity));
  return anyCompatible ?? REST_FALLBACK;
}

function familyReferenceExercise(base: MoveExercise, progression: MoveProgressionContext) {
  const previousIds = progression.previousExerciseIds ?? [];
  const matches = previousIds
    .map((id) => MOVE_EXERCISE_BY_ID[id])
    .filter((exercise): exercise is MoveExercise => Boolean(exercise && exercise.family === base.family));
  if (!matches.length) return base;
  return matches.reduce((best, item) => item.difficulty > best.difficulty ? item : best, matches[0]);
}

function progressionAdjustedExercise(
  base: MoveExercise,
  preferences: MovePreferences,
  intensity: MoveIntensity,
  progression: MoveProgressionContext,
) {
  const reference = familyReferenceExercise(base, progression);
  const delta = moveFeedbackDifficultyDelta(progression.lastFeedback, progression.lastEndedEarly);
  const target = clampMoveDifficulty(reference.difficulty + delta);

  const candidates = MOVE_EXERCISE_LIBRARY
    .filter((exercise) => exercise.family === base.family)
    .filter((exercise) => moveExerciseCompatible(exercise, preferences, intensity));

  if (!candidates.length) return null;

  const directional = candidates.filter((exercise) => {
    if (delta > 0) return exercise.difficulty > reference.difficulty;
    if (delta < 0) return exercise.difficulty < reference.difficulty;
    return exercise.difficulty === reference.difficulty;
  });

  const pool = directional.length ? directional : candidates;
  return [...pool].sort((a, b) => {
    const distanceA = Math.abs(a.difficulty - target);
    const distanceB = Math.abs(b.difficulty - target);
    if (distanceA !== distanceB) return distanceA - distanceB;

    const equipmentA = a.equipment?.length ? 1 : 0;
    const equipmentB = b.equipment?.length ? 1 : 0;
    const loadGoal = preferences.goal === 'fuerza' || preferences.goal === 'musculo' || preferences.focus === 'fuerza';
    if (loadGoal && equipmentA !== equipmentB) return equipmentB - equipmentA;
    return a.title.localeCompare(b.title);
  })[0];
}

function compatibleExercise(
  exercise: MoveExercise,
  preferences: MovePreferences,
  intensity: MoveIntensity,
  progression: MoveProgressionContext,
) {
  const progressed = progressionAdjustedExercise(exercise, preferences, intensity, progression);
  if (progressed) return progressed;
  if (moveExerciseCompatible(exercise, preferences, intensity)) return exercise;

  const swap = MOVE_EXERCISE_BY_ID[exercise.swapWith];
  if (swap && moveExerciseCompatible(swap, preferences, intensity)) return swap;
  return firstSafeFallback(preferences, intensity);
}

function loadPriorityCount(preferences: MovePreferences) {
  const ratio = declaredExternalLoadRatio(preferences);
  if (ratio === null) return 2;
  if (ratio <= 0.15) return 3;
  if (ratio <= 0.35) return 2;
  return 1;
}

function orderedIds(preferences: MovePreferences, intensity: MoveIntensity) {
  let order = [...(FOCUS_ORDER[preferences.focus] ?? FOCUS_ORDER.equilibrado)];

  if (preferences.focus === 'equilibrado' && preferences.goal === 'condicion') {
    order = [...CONDITIONING_PREFIX, ...order];
  }
  if (preferences.focus === 'equilibrado' && preferences.goal === 'movilidad') {
    order = [...MOBILITY_PREFIX, ...order];
  }

  const loadGoal = preferences.goal === 'fuerza'
    || preferences.goal === 'musculo'
    || preferences.focus === 'fuerza';

  if (loadGoal && MOVE_INTENSITY_RANK[intensity] >= MOVE_INTENSITY_RANK.suave) {
    const loadLimit = intensity === 'suave' ? 1 : loadPriorityCount(preferences);
    const compatibleLoaded = LOADED_ORDER
      .map((id) => MOVE_EXERCISE_BY_ID[id])
      .filter((exercise): exercise is MoveExercise => Boolean(exercise))
      .filter((exercise) => moveExerciseCompatible(exercise, preferences, intensity))
      .map((exercise) => exercise.id)
      .slice(0, loadLimit);
    if (compatibleLoaded.length) order = [...compatibleLoaded, ...order];
  }

  return order;
}

function idsFor(
  preferences: MovePreferences,
  count: number,
  intensity: MoveIntensity,
  progression: MoveProgressionContext,
) {
  const order = orderedIds(preferences, intensity);
  const selected: MoveExercise[] = [];
  let cursor = 0;

  while (selected.length < count) {
    const base = MOVE_EXERCISE_BY_ID[order[cursor % order.length]] ?? MOVE_EXERCISE_BY_ID.breathing;
    selected.push(compatibleExercise(base, preferences, intensity, progression));
    cursor += 1;
  }

  if (selected.length) selected[selected.length - 1] = firstSafeFallback(preferences, intensity);
  return selected;
}

function restSecondsFor(targetMinutes: number, intensity: MoveIntensity) {
  const base = targetMinutes <= 5 ? 8 : targetMinutes <= 10 ? 10 : 12;
  if (intensity === 'recuperacion') return base + 10;
  if (intensity === 'suave') return base + 5;
  if (intensity === 'alta') return Math.max(5, base - 3);
  return base;
}

export function routineForDuration(
  value: number,
  preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES,
  intensity: MoveIntensity = 'moderada',
  progression: MoveProgressionContext = {},
): MoveRoutine {
  const targetMinutes = supportedDuration(value);
  const exercises = idsFor(preferences, STEP_COUNT[targetMinutes], intensity, progression);
  const restAfterSec = restSecondsFor(targetMinutes, intensity);
  const targetSeconds = targetMinutes * 60;
  const restBudget = restAfterSec * Math.max(0, exercises.length - 1);
  const exerciseBudget = targetSeconds - restBudget;
  const base = Math.floor(exerciseBudget / exercises.length);
  let remaining = exerciseBudget - base * exercises.length;

  const steps = exercises.map((exercise, slot) => {
    const durationSec = base + (remaining > 0 ? 1 : 0);
    if (remaining > 0) remaining -= 1;
    return {
      slot,
      exercise,
      durationSec,
      restAfterSec: slot === exercises.length - 1 ? 0 : restAfterSec,
    };
  });

  return {
    id: `move-${targetMinutes}-${preferences.focus}-${intensity}-${moveFeedbackDifficultyDelta(progression.lastFeedback, progression.lastEndedEarly)}`,
    targetMinutes,
    intensity,
    steps,
    totalSeconds: steps.reduce((total, step) => total + step.durationSec + step.restAfterSec, 0),
  };
}

export function previewForDuration(
  value: number,
  preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES,
  intensity: MoveIntensity = 'moderada',
  progression: MoveProgressionContext = {},
) {
  const routine = routineForDuration(value, preferences, intensity, progression);
  const unique: MoveExercise[] = [];
  for (const step of routine.steps) {
    if (!unique.some((item) => item.id === step.exercise.id)) unique.push(step.exercise);
    if (unique.length >= 4) break;
  }
  return unique;
}

export function exerciseById(id: string | undefined, fallback: MoveExercise) {
  return id ? MOVE_EXERCISE_BY_ID[id] ?? fallback : fallback;
}

export function alternateExercise(
  current: MoveExercise,
  preferences: MovePreferences,
  intensity: MoveIntensity = 'moderada',
) {
  const sameFamily = MOVE_EXERCISE_LIBRARY
    .filter((exercise) => exercise.family === current.family && exercise.id !== current.id)
    .filter((exercise) => moveExerciseCompatible(exercise, preferences, intensity))
    .sort((a, b) => {
      const distanceA = Math.abs(a.difficulty - current.difficulty);
      const distanceB = Math.abs(b.difficulty - current.difficulty);
      if (distanceA !== distanceB) return distanceA - distanceB;
      return a.difficulty - b.difficulty;
    });

  if (sameFamily[0]) return sameFamily[0];

  const explicitSwap = MOVE_EXERCISE_BY_ID[current.swapWith];
  if (explicitSwap && moveExerciseCompatible(explicitSwap, preferences, intensity)) return explicitSwap;

  return firstSafeFallback(preferences, intensity);
}

export function moveExerciseEquipmentLabel(exercise: MoveExercise, preferences: MovePreferences) {
  const labels = (exercise.equipment ?? [])
    .map((item) => moveEquipmentLabel(item, preferences))
    .filter((item): item is string => Boolean(item));
  return labels.length ? labels.join(' · ') : null;
}

export function exerciseCueForPreferences(exercise: MoveExercise, preferences: MovePreferences) {
  const equipment = moveExerciseEquipmentLabel(exercise, preferences);
  if (!equipment) return exercise.cue;
  return `${exercise.cue} Equipo registrado: ${equipment}. Si ese nivel no se siente controlable, cambia el ejercicio.`;
}

export function compatibleLibraryExercises(
  preferences: MovePreferences,
  intensity: MoveIntensity = 'moderada',
) {
  return MOVE_EXERCISE_LIBRARY.filter((exercise) => moveExerciseCompatible(exercise, preferences, intensity));
}
