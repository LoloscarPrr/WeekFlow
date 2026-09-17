import {
  DEFAULT_MOVE_PREFERENCES,
  MOVE_EXPERIENCE_RANK,
  MOVE_INTENSITY_RANK,
  declaredExternalLoadRatio,
  moveEquipmentAvailable,
  moveEquipmentLabel,
  type MoveAvoidArea,
  type MoveEquipmentType,
  type MoveExperience,
  type MoveFocus,
  type MoveIntensity,
  type MovePreferences,
} from './adaptation';

export type MoveExercise = {
  id: string;
  icon: string;
  title: string;
  cue: string;
  easier: string;
  swapWith: string;
  needs: 'none' | 'chair' | 'floor';
  focus: MoveFocus[];
  areas: MoveAvoidArea[];
  equipment?: MoveEquipmentType[];
  minExperience?: Exclude<MoveExperience, 'sin_definir'>;
  minIntensity?: MoveIntensity;
};
export type MoveStep = { slot: number; exercise: MoveExercise; durationSec: number; restAfterSec: number };
export type MoveRoutine = { id: string; targetMinutes: number; intensity: MoveIntensity; steps: MoveStep[]; totalSeconds: number };

const EXERCISES: Record<string, MoveExercise> = {
  shoulders: { id: 'shoulders', icon: '🙆', title: 'Círculos de hombros', cue: 'Haz círculos lentos con los hombros a un ritmo cómodo.', easier: 'Haz círculos más pequeños o mueve un hombro a la vez.', swapWith: 'reach', needs: 'none', focus: ['equilibrado', 'movilidad'], areas: ['shoulders'] },
  march: { id: 'march', icon: '🚶', title: 'Marcha activa', cue: 'Marcha en el sitio con pasos firmes y brazos sueltos, manteniendo un ritmo que puedas sostener.', easier: 'Haz pasos más bajos y usa una pared o silla como apoyo.', swapWith: 'toe-tap', needs: 'none', focus: ['equilibrado', 'activar'], areas: ['knees'] },
  'side-step': { id: 'side-step', icon: '↔️', title: 'Pasos laterales continuos', cue: 'Muévete de lado a lado sin detenerte, manteniendo las rodillas cómodas y el tronco estable.', easier: 'Acorta el paso y mantén una mano apoyada.', swapWith: 'march', needs: 'none', focus: ['equilibrado', 'activar'], areas: ['knees'] },
  squat: { id: 'squat', icon: '🏋️', title: 'Sentadilla controlada', cue: 'Lleva la cadera atrás y baja hasta un rango cómodo; empuja el suelo para volver a subir.', easier: 'Baja menos o toca una silla antes de volver a subir.', swapWith: 'heel-raise', needs: 'none', focus: ['fuerza', 'equilibrado'], areas: ['knees', 'lowerBack'] },
  'reverse-lunge': { id: 'reverse-lunge', icon: '🦿', title: 'Zancada atrás corta', cue: 'Da un paso corto hacia atrás, baja con control y vuelve al centro. Alterna lados.', easier: 'Haz el paso más corto o apóyate suavemente en una pared.', swapWith: 'squat', needs: 'none', focus: ['fuerza', 'activar'], areas: ['knees'], minExperience: 'intermedio' },
  'hip-hinge': { id: 'hip-hinge', icon: '↘️', title: 'Bisagra de cadera', cue: 'Lleva la cadera hacia atrás con la espalda larga y vuelve apretando glúteos, sin buscar profundidad.', easier: 'Reduce el recorrido y mantén las manos sobre los muslos.', swapWith: 'heel-raise', needs: 'none', focus: ['fuerza', 'equilibrado'], areas: ['lowerBack'] },
  'wall-sit': { id: 'wall-sit', icon: '🧱', title: 'Sentadilla isométrica en pared', cue: 'Apoya la espalda en una pared y mantén una flexión de piernas cómoda durante el intervalo.', easier: 'Quédate más arriba y sostén menos profundidad.', swapWith: 'heel-raise', needs: 'none', focus: ['fuerza'], areas: ['knees', 'lowerBack'] },
  'chair-rise': { id: 'chair-rise', icon: '🪑', title: 'Sentarse y levantarse', cue: 'Desde una silla firme, ponte de pie y vuelve a sentarte con control.', easier: 'Usa las manos como apoyo o haz solo una parte del recorrido.', swapWith: 'squat', needs: 'chair', focus: ['equilibrado', 'fuerza'], areas: ['knees', 'lowerBack'] },
  'wall-press': { id: 'wall-press', icon: '🧱', title: 'Flexión en pared', cue: 'Apoya las manos en una pared, acerca el pecho con el cuerpo alineado y empuja para volver.', easier: 'Acércate más a la pared para reducir el esfuerzo.', swapWith: 'heel-raise', needs: 'none', focus: ['equilibrado', 'fuerza'], areas: ['shoulders', 'wrists'] },
  'incline-push': { id: 'incline-push', icon: '💪', title: 'Flexión inclinada con apoyo', cue: 'Con una silla firme apoyada contra una pared, baja el pecho con control y empuja para volver.', easier: 'Usa la pared en vez de la silla para reducir la carga.', swapWith: 'wall-press', needs: 'chair', focus: ['fuerza'], areas: ['shoulders', 'wrists'] },
  'heel-raise': { id: 'heel-raise', icon: '🦶', title: 'Elevación de talones', cue: 'Sube a las puntas de los pies, haz una pausa breve y baja con control.', easier: 'Usa una silla o pared como apoyo y haz menos altura.', swapWith: 'calf-release', needs: 'none', focus: ['equilibrado', 'fuerza'], areas: [] },
  'knee-lift': { id: 'knee-lift', icon: '🦵', title: 'Rodillas alternadas', cue: 'Eleva una rodilla y luego la otra de forma continua, manteniendo el tronco estable.', easier: 'Levanta menos la rodilla o cambia a toques de punta.', swapWith: 'toe-tap', needs: 'none', focus: ['activar', 'equilibrado'], areas: ['knees'] },
  'squat-reach': { id: 'squat-reach', icon: '⚡', title: 'Sentadilla + alcance', cue: 'Haz una sentadilla corta y al subir lleva los brazos arriba. Repite de forma fluida.', easier: 'Reduce la profundidad y lleva las manos solo hasta el pecho.', swapWith: 'march', needs: 'none', focus: ['activar', 'equilibrado'], areas: ['knees', 'shoulders', 'lowerBack'] },
  'toe-tap': { id: 'toe-tap', icon: '👟', title: 'Toques al frente', cue: 'Toca el suelo al frente con un pie y vuelve. Alterna lados con ritmo continuo.', easier: 'Haz el toque muy cerca del cuerpo y usa apoyo.', swapWith: 'march', needs: 'none', focus: ['activar', 'movilidad', 'equilibrado'], areas: ['knees'] },
  reach: { id: 'reach', icon: '🌤️', title: 'Alcances suaves', cue: 'Eleva un brazo y cambia de lado sin forzar el rango.', easier: 'Lleva las manos solo hasta la altura del pecho.', swapWith: 'shoulders', needs: 'none', focus: ['movilidad', 'equilibrado'], areas: ['shoulders'] },
  'calf-release': { id: 'calf-release', icon: '🌿', title: 'Soltar pantorrillas', cue: 'Da un paso atrás, apoya el talón y mantén una tensión suave. Cambia de lado.', easier: 'Acorta la distancia entre los pies.', swapWith: 'breathing', needs: 'none', focus: ['movilidad', 'equilibrado'], areas: [] },
  bridge: { id: 'bridge', icon: '🌉', title: 'Puente de cadera', cue: 'Boca arriba con rodillas flexionadas, eleva la cadera con control y vuelve sin dejarla caer.', easier: 'Haz un recorrido más corto y descansa entre repeticiones.', swapWith: 'heel-raise', needs: 'floor', focus: ['fuerza', 'equilibrado'], areas: ['knees', 'lowerBack'] },
  plank: { id: 'plank', icon: '📏', title: 'Plancha alta', cue: 'Desde cuatro apoyos, extiende las piernas y mantén el cuerpo estable durante el intervalo.', easier: 'Mantén las rodillas apoyadas en el suelo.', swapWith: 'bridge', needs: 'floor', focus: ['fuerza'], areas: ['shoulders', 'wrists', 'lowerBack'], minExperience: 'intermedio' },
  'bird-dog': { id: 'bird-dog', icon: '🧭', title: 'Extensión en cuatro apoyos', cue: 'En cuatro apoyos, alarga brazo y pierna contrarios, vuelve y cambia de lado con control.', easier: 'Mueve solo un brazo o una pierna cada vez.', swapWith: 'bridge', needs: 'floor', focus: ['fuerza', 'movilidad'], areas: ['shoulders', 'wrists', 'lowerBack'], minExperience: 'intermedio' },
  breathing: { id: 'breathing', icon: '😌', title: 'Respiración de cierre', cue: 'Baja el ritmo y respira cómodo, sin aguantar el aire.', easier: 'Respira a tu ritmo natural; no necesitas contar.', swapWith: 'calf-release', needs: 'none', focus: ['movilidad', 'equilibrado'], areas: [] },

  'db-goblet-squat': { id: 'db-goblet-squat', icon: '🏋️', title: 'Sentadilla goblet con mancuerna', cue: 'Sujeta una mancuerna cerca del pecho, lleva la cadera atrás y vuelve a subir con control.', easier: 'Haz menos profundidad; si la carga no se siente controlable, cambia a sentadilla sin peso.', swapWith: 'squat', needs: 'none', focus: ['fuerza', 'equilibrado'], areas: ['knees', 'lowerBack'], equipment: ['dumbbells'], minIntensity: 'moderada' },
  'db-rdl': { id: 'db-rdl', icon: '🏋️', title: 'Peso muerto rumano con mancuernas', cue: 'Lleva la cadera atrás con las mancuernas cerca de las piernas y vuelve apretando glúteos, sin redondear la espalda.', easier: 'Reduce el recorrido o cambia a bisagra de cadera sin carga.', swapWith: 'hip-hinge', needs: 'none', focus: ['fuerza'], areas: ['lowerBack'], equipment: ['dumbbells'], minExperience: 'intermedio', minIntensity: 'moderada' },
  'db-row': { id: 'db-row', icon: '💪', title: 'Remo con mancuernas', cue: 'Inclina el tronco desde la cadera con espalda larga y lleva las mancuernas hacia los costados sin encoger los hombros.', easier: 'Usa menos recorrido o cambia a un movimiento sin carga.', swapWith: 'wall-press', needs: 'none', focus: ['fuerza'], areas: ['shoulders', 'lowerBack'], equipment: ['dumbbells'], minExperience: 'intermedio', minIntensity: 'moderada' },
  'kb-deadlift': { id: 'kb-deadlift', icon: '🔔', title: 'Peso muerto con kettlebell', cue: 'Deja la kettlebell entre los pies, lleva la cadera atrás y ponte de pie empujando el suelo con control.', easier: 'Reduce el recorrido o cambia a bisagra de cadera sin carga.', swapWith: 'hip-hinge', needs: 'none', focus: ['fuerza', 'equilibrado'], areas: ['knees', 'lowerBack'], equipment: ['kettlebell'], minIntensity: 'moderada' },
  'kb-goblet-squat': { id: 'kb-goblet-squat', icon: '🔔', title: 'Sentadilla goblet con kettlebell', cue: 'Sujeta la kettlebell cerca del pecho, baja hasta un rango cómodo y vuelve a subir con control.', easier: 'Baja menos o cambia a sentadilla sin carga.', swapWith: 'squat', needs: 'none', focus: ['fuerza'], areas: ['knees', 'lowerBack'], equipment: ['kettlebell'], minIntensity: 'moderada' },
  'band-row': { id: 'band-row', icon: '➰', title: 'Remo con banda', cue: 'Toma la banda con tensión cómoda y lleva los codos hacia atrás sin elevar los hombros.', easier: 'Reduce la tensión o el recorrido; si no se siente controlable, cambia el ejercicio.', swapWith: 'wall-press', needs: 'none', focus: ['fuerza', 'equilibrado'], areas: ['shoulders'], equipment: ['band'], minIntensity: 'suave' },
  'band-pull-apart': { id: 'band-pull-apart', icon: '➰', title: 'Apertura con banda', cue: 'Con brazos al frente y tensión suave, abre la banda sin forzar el rango de hombros.', easier: 'Usa menos tensión o mueve las manos menos distancia.', swapWith: 'reach', needs: 'none', focus: ['fuerza', 'movilidad'], areas: ['shoulders'], equipment: ['band'], minIntensity: 'suave' },
};

const FOCUS_ORDER: Record<MoveFocus, string[]> = {
  equilibrado: ['march', 'squat', 'wall-press', 'side-step', 'hip-hinge', 'shoulders', 'knee-lift', 'chair-rise', 'reach', 'bridge', 'calf-release', 'breathing'],
  activar: ['march', 'side-step', 'squat-reach', 'knee-lift', 'reverse-lunge', 'toe-tap', 'march', 'side-step', 'squat-reach', 'knee-lift', 'calf-release', 'breathing'],
  fuerza: ['squat', 'wall-sit', 'wall-press', 'hip-hinge', 'chair-rise', 'reverse-lunge', 'incline-push', 'bridge', 'plank', 'bird-dog', 'heel-raise', 'breathing'],
  movilidad: ['shoulders', 'reach', 'calf-release', 'toe-tap', 'bird-dog', 'reach', 'shoulders', 'calf-release', 'toe-tap', 'breathing'],
};

const LOADED_ORDER = ['db-goblet-squat', 'band-row', 'kb-deadlift', 'db-rdl', 'kb-goblet-squat', 'db-row', 'band-pull-apart'];
const CONDITIONING_PREFIX = ['march', 'side-step', 'knee-lift', 'squat-reach'];
const MOBILITY_PREFIX = ['shoulders', 'reach', 'calf-release', 'toe-tap'];
const SAFE_FALLBACK_ORDER = ['heel-raise', 'calf-release', 'breathing'];
const STEP_COUNT: Record<number, number> = { 5: 5, 10: 9, 20: 16, 30: 22 };

function supportedDuration(value: number) { if (value <= 5) return 5; if (value <= 10) return 10; if (value <= 20) return 20; return 30; }

function experienceCompatible(exercise: MoveExercise, preferences: MovePreferences) {
  if (!exercise.minExperience || preferences.experience === 'sin_definir') return true;
  return MOVE_EXPERIENCE_RANK[preferences.experience] >= MOVE_EXPERIENCE_RANK[exercise.minExperience];
}

function intensityCompatible(exercise: MoveExercise, intensity: MoveIntensity) {
  if (!exercise.minIntensity) return true;
  return MOVE_INTENSITY_RANK[intensity] >= MOVE_INTENSITY_RANK[exercise.minIntensity];
}

export function moveExerciseCompatible(exercise: MoveExercise, preferences: MovePreferences, intensity: MoveIntensity = 'moderada') {
  if (exercise.needs === 'floor' && !preferences.floorAllowed) return false;
  if (exercise.needs === 'chair' && !preferences.chairAvailable) return false;
  if (exercise.areas.some((area) => preferences.avoidAreas.includes(area))) return false;
  if (!experienceCompatible(exercise, preferences)) return false;
  if (!intensityCompatible(exercise, intensity)) return false;
  if ((exercise.equipment ?? []).some((item) => !moveEquipmentAvailable(item, preferences))) return false;
  return true;
}

function firstSafeFallback(preferences: MovePreferences, intensity: MoveIntensity) {
  for (const id of SAFE_FALLBACK_ORDER) {
    const exercise = EXERCISES[id];
    if (exercise && moveExerciseCompatible(exercise, preferences, intensity)) return exercise;
  }
  return EXERCISES.breathing;
}

function compatibleExercise(exercise: MoveExercise, preferences: MovePreferences, intensity: MoveIntensity) {
  if (moveExerciseCompatible(exercise, preferences, intensity)) return exercise;
  const swap = EXERCISES[exercise.swapWith];
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

  // The user's explicit focus for today wins. The base goal only nudges an
  // equilibrado session, or adds load variants when Fuerza was chosen directly.
  if (preferences.focus === 'equilibrado' && preferences.goal === 'condicion') order = [...CONDITIONING_PREFIX, ...order];
  if (preferences.focus === 'equilibrado' && preferences.goal === 'movilidad') order = [...MOBILITY_PREFIX, ...order];

  const loadGoal = preferences.goal === 'fuerza' || preferences.goal === 'musculo' || preferences.focus === 'fuerza';
  if (loadGoal && MOVE_INTENSITY_RANK[intensity] >= MOVE_INTENSITY_RANK.moderada) {
    const compatibleLoaded = LOADED_ORDER
      .map((id) => EXERCISES[id])
      .filter((exercise) => exercise && moveExerciseCompatible(exercise, preferences, intensity))
      .map((exercise) => exercise.id)
      .slice(0, loadPriorityCount(preferences));
    if (compatibleLoaded.length) order = [...compatibleLoaded, ...order];
  }

  return order;
}

function idsFor(preferences: MovePreferences, count: number, intensity: MoveIntensity) {
  const order = orderedIds(preferences, intensity);
  const ids: string[] = [];
  let cursor = 0;
  while (ids.length < count) {
    const base = EXERCISES[order[cursor % order.length]] ?? EXERCISES.breathing;
    const selected = compatibleExercise(base, preferences, intensity);
    ids.push(selected.id);
    cursor += 1;
  }
  if (ids.length) ids[ids.length - 1] = 'breathing';
  return ids;
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
): MoveRoutine {
  const targetMinutes = supportedDuration(value);
  const ids = idsFor(preferences, STEP_COUNT[targetMinutes], intensity);
  const restAfterSec = restSecondsFor(targetMinutes, intensity);
  const targetSeconds = targetMinutes * 60;
  const restBudget = restAfterSec * Math.max(0, ids.length - 1);
  const exerciseBudget = targetSeconds - restBudget;
  const base = Math.floor(exerciseBudget / ids.length);
  let remaining = exerciseBudget - base * ids.length;
  const steps = ids.map((id, slot) => {
    const durationSec = base + (remaining > 0 ? 1 : 0);
    if (remaining > 0) remaining -= 1;
    return { slot, exercise: EXERCISES[id], durationSec, restAfterSec: slot === ids.length - 1 ? 0 : restAfterSec };
  });
  const avoided = preferences.avoidAreas.length ? preferences.avoidAreas.slice().sort().join('+') : 'none';
  const equipment = `db${preferences.equipment.dumbbellsKg ?? 'none'}-kb${preferences.equipment.kettlebellKg ?? 'none'}-band${preferences.equipment.resistanceBand ? 'yes' : 'no'}`;
  const profile = `${preferences.experience}-${preferences.goal}-w${preferences.weightKg ?? 'na'}`;
  const mode = `${preferences.focus}-${intensity}-${preferences.floorAllowed ? 'floor' : 'standing'}-${preferences.chairAvailable ? 'chair' : 'nochair'}-avoid-${avoided}-${profile}-${equipment}`;
  return { id: `move-${targetMinutes}-${mode}`, targetMinutes, intensity, steps, totalSeconds: steps.reduce((sum, step) => sum + step.durationSec + step.restAfterSec, 0) };
}

export function exerciseById(id: string | undefined, fallback: MoveExercise) { return id && EXERCISES[id] ? EXERCISES[id] : fallback; }

export function alternateExercise(
  exercise: MoveExercise,
  preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES,
  intensity: MoveIntensity = 'moderada',
) {
  return compatibleExercise(EXERCISES[exercise.swapWith] ?? exercise, preferences, intensity);
}

export function previewForDuration(
  value: number,
  preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES,
  intensity: MoveIntensity = 'moderada',
) {
  const routine = routineForDuration(value, preferences, intensity);
  const unique: MoveExercise[] = [];
  for (const step of routine.steps) {
    if (!unique.some((item) => item.id === step.exercise.id)) unique.push(step.exercise);
    if (unique.length >= 4) break;
  }
  return unique;
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
  return `${exercise.cue} Equipo registrado: ${equipment}. Si ese nivel de resistencia no se siente controlable, cambia el ejercicio.`;
}
