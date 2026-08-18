import { DEFAULT_MOVE_PREFERENCES, type MoveFocus, type MovePreferences } from '@/src/move/adaptation';

export type MoveExercise = {
  id: string;
  icon: string;
  title: string;
  cue: string;
  easier: string;
  swapWith: string;
  needs: 'none' | 'chair' | 'floor';
  focus: MoveFocus[];
};
export type MoveStep = { slot: number; exercise: MoveExercise; durationSec: number; restAfterSec: number };
export type MoveRoutine = { id: string; targetMinutes: number; steps: MoveStep[]; totalSeconds: number };

const EXERCISES: Record<string, MoveExercise> = {
  shoulders: { id: 'shoulders', icon: '🙆', title: 'Círculos de hombros', cue: 'Haz círculos lentos con los hombros a un ritmo cómodo.', easier: 'Haz círculos más pequeños o mueve un hombro a la vez.', swapWith: 'reach', needs: 'none', focus: ['equilibrado', 'movilidad'] },
  march: { id: 'march', icon: '🚶', title: 'Marcha cómoda', cue: 'Camina en el sitio con pasos suaves y respiración normal.', easier: 'Haz pasos más bajos y usa una pared o silla como apoyo.', swapWith: 'toe-tap', needs: 'none', focus: ['equilibrado', 'activar'] },
  'side-step': { id: 'side-step', icon: '↔️', title: 'Pasos laterales', cue: 'Da un paso a un lado y vuelve al centro. Alterna lados.', easier: 'Acorta el paso y mantén una mano apoyada.', swapWith: 'march', needs: 'none', focus: ['equilibrado', 'activar'] },
  'chair-rise': { id: 'chair-rise', icon: '🪑', title: 'Sentarse y levantarse', cue: 'Desde una silla firme, ponte de pie y vuelve a sentarte con control.', easier: 'Usa las manos como apoyo o haz solo una parte del recorrido.', swapWith: 'heel-raise', needs: 'chair', focus: ['equilibrado', 'fuerza'] },
  'wall-press': { id: 'wall-press', icon: '🧱', title: 'Empuje en pared', cue: 'Apoya las manos en una pared, acerca el pecho con control y vuelve.', easier: 'Acércate más a la pared para reducir el esfuerzo.', swapWith: 'shoulders', needs: 'none', focus: ['equilibrado', 'fuerza'] },
  'heel-raise': { id: 'heel-raise', icon: '🦶', title: 'Elevación de talones', cue: 'Sube suavemente a las puntas de los pies y baja con control.', easier: 'Usa una silla o pared como apoyo y haz menos altura.', swapWith: 'chair-rise', needs: 'none', focus: ['equilibrado', 'fuerza'] },
  'knee-lift': { id: 'knee-lift', icon: '🦵', title: 'Rodillas alternadas', cue: 'Eleva una rodilla y luego la otra sin buscar altura máxima.', easier: 'Levanta menos la rodilla o cambia a toques de punta.', swapWith: 'toe-tap', needs: 'none', focus: ['activar', 'equilibrado'] },
  'toe-tap': { id: 'toe-tap', icon: '👟', title: 'Toques al frente', cue: 'Toca el suelo al frente con un pie y vuelve. Alterna lados.', easier: 'Haz el toque muy cerca del cuerpo y usa apoyo.', swapWith: 'knee-lift', needs: 'none', focus: ['activar', 'movilidad', 'equilibrado'] },
  reach: { id: 'reach', icon: '🌤️', title: 'Alcances suaves', cue: 'Eleva un brazo y cambia de lado sin forzar el rango.', easier: 'Lleva las manos solo hasta la altura del pecho.', swapWith: 'shoulders', needs: 'none', focus: ['movilidad', 'equilibrado'] },
  'calf-release': { id: 'calf-release', icon: '🌿', title: 'Soltar pantorrillas', cue: 'Da un paso atrás, apoya el talón y mantén una tensión suave. Cambia de lado.', easier: 'Acorta la distancia entre los pies.', swapWith: 'breathing', needs: 'none', focus: ['movilidad', 'equilibrado'] },
  bridge: { id: 'bridge', icon: '🌉', title: 'Puente de cadera', cue: 'Boca arriba con rodillas flexionadas, eleva la cadera hasta una posición cómoda y vuelve con control.', easier: 'Haz un recorrido más corto y descansa entre repeticiones.', swapWith: 'heel-raise', needs: 'floor', focus: ['fuerza', 'equilibrado'] },
  'bird-dog': { id: 'bird-dog', icon: '🧭', title: 'Extensión en cuatro apoyos', cue: 'En cuatro apoyos, alarga un brazo o una pierna y vuelve antes de cambiar de lado.', easier: 'Mueve solo un brazo cada vez y mantén el recorrido corto.', swapWith: 'reach', needs: 'floor', focus: ['fuerza', 'movilidad'] },
  breathing: { id: 'breathing', icon: '😌', title: 'Respiración de cierre', cue: 'Baja el ritmo y respira cómodo, sin aguantar el aire.', easier: 'Respira a tu ritmo natural; no necesitas contar.', swapWith: 'calf-release', needs: 'none', focus: ['movilidad', 'equilibrado'] },
};

const FOCUS_ORDER: Record<MoveFocus, string[]> = {
  equilibrado: ['shoulders', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'toe-tap', 'reach', 'bridge', 'knee-lift', 'calf-release', 'breathing'],
  activar: ['shoulders', 'march', 'side-step', 'toe-tap', 'knee-lift', 'march', 'reach', 'side-step', 'toe-tap', 'heel-raise', 'calf-release', 'breathing'],
  fuerza: ['shoulders', 'chair-rise', 'wall-press', 'heel-raise', 'bridge', 'bird-dog', 'chair-rise', 'wall-press', 'heel-raise', 'bridge', 'calf-release', 'breathing'],
  movilidad: ['shoulders', 'reach', 'toe-tap', 'calf-release', 'bird-dog', 'side-step', 'reach', 'shoulders', 'toe-tap', 'calf-release', 'breathing'],
};

const STEP_COUNT: Record<number, number> = { 5: 5, 10: 9, 20: 16, 30: 22 };

function supportedDuration(value: number) { if (value <= 5) return 5; if (value <= 10) return 10; if (value <= 20) return 20; return 30; }

function compatible(exercise: MoveExercise, preferences: MovePreferences) {
  if (exercise.needs === 'floor' && !preferences.floorAllowed) return false;
  if (exercise.needs === 'chair' && !preferences.chairAvailable) return false;
  return true;
}

function compatibleExercise(exercise: MoveExercise, preferences: MovePreferences) {
  if (compatible(exercise, preferences)) return exercise;
  const swap = EXERCISES[exercise.swapWith];
  if (swap && compatible(swap, preferences)) return swap;
  return EXERCISES.march;
}

function idsFor(preferences: MovePreferences, count: number) {
  const order = FOCUS_ORDER[preferences.focus] ?? FOCUS_ORDER.equilibrado;
  const ids: string[] = [];
  let cursor = 0;
  while (ids.length < count) {
    const base = EXERCISES[order[cursor % order.length]] ?? EXERCISES.march;
    const selected = compatibleExercise(base, preferences);
    ids.push(selected.id);
    cursor += 1;
  }
  if (ids.length) ids[ids.length - 1] = 'breathing';
  return ids;
}

export function routineForDuration(value: number, preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES): MoveRoutine {
  const targetMinutes = supportedDuration(value);
  const ids = idsFor(preferences, STEP_COUNT[targetMinutes]);
  const restAfterSec = targetMinutes <= 5 ? 8 : targetMinutes <= 10 ? 10 : 12;
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
  const mode = `${preferences.focus}-${preferences.floorAllowed ? 'floor' : 'standing'}-${preferences.chairAvailable ? 'chair' : 'nochair'}`;
  return { id: `move-${targetMinutes}-${mode}`, targetMinutes, steps, totalSeconds: steps.reduce((sum, step) => sum + step.durationSec + step.restAfterSec, 0) };
}

export function exerciseById(id: string | undefined, fallback: MoveExercise) { return id && EXERCISES[id] ? EXERCISES[id] : fallback; }
export function alternateExercise(exercise: MoveExercise, preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES) { return compatibleExercise(EXERCISES[exercise.swapWith] ?? exercise, preferences); }
export function previewForDuration(value: number, preferences: MovePreferences = DEFAULT_MOVE_PREFERENCES) {
  const routine = routineForDuration(value, preferences);
  const unique: MoveExercise[] = [];
  for (const step of routine.steps) {
    if (!unique.some((item) => item.id === step.exercise.id)) unique.push(step.exercise);
    if (unique.length >= 4) break;
  }
  return unique;
}
