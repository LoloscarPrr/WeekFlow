export type MoveExercise = { id: string; icon: string; title: string; cue: string; easier: string; swapWith: string };
export type MoveStep = { slot: number; exercise: MoveExercise; durationSec: number; restAfterSec: number };
export type MoveRoutine = { id: string; targetMinutes: number; steps: MoveStep[]; totalSeconds: number };

const EXERCISES: Record<string, MoveExercise> = {
  shoulders: { id: 'shoulders', icon: '🙆', title: 'Círculos de hombros', cue: 'Haz círculos lentos con los hombros a un ritmo cómodo.', easier: 'Haz círculos más pequeños o mueve un hombro a la vez.', swapWith: 'reach' },
  march: { id: 'march', icon: '🚶', title: 'Marcha cómoda', cue: 'Camina en el sitio con pasos suaves y respiración normal.', easier: 'Haz pasos más bajos y usa una pared o silla como apoyo.', swapWith: 'toe-tap' },
  'side-step': { id: 'side-step', icon: '↔️', title: 'Pasos laterales', cue: 'Da un paso a un lado y vuelve al centro. Alterna lados.', easier: 'Acorta el paso y mantén una mano apoyada.', swapWith: 'march' },
  'chair-rise': { id: 'chair-rise', icon: '🪑', title: 'Sentarse y levantarse', cue: 'Desde una silla firme, ponte de pie y vuelve a sentarte con control.', easier: 'Usa las manos como apoyo o haz solo una parte del recorrido.', swapWith: 'heel-raise' },
  'wall-press': { id: 'wall-press', icon: '🧱', title: 'Empuje en pared', cue: 'Apoya las manos en una pared, acerca el pecho con control y vuelve.', easier: 'Acércate más a la pared para reducir el esfuerzo.', swapWith: 'shoulders' },
  'heel-raise': { id: 'heel-raise', icon: '🦶', title: 'Elevación de talones', cue: 'Sube suavemente a las puntas de los pies y baja con control.', easier: 'Usa una silla o pared como apoyo y haz menos altura.', swapWith: 'chair-rise' },
  'knee-lift': { id: 'knee-lift', icon: '🦵', title: 'Rodillas alternadas', cue: 'Eleva una rodilla y luego la otra sin buscar altura máxima.', easier: 'Levanta menos la rodilla o cambia a toques de punta.', swapWith: 'toe-tap' },
  'toe-tap': { id: 'toe-tap', icon: '👟', title: 'Toques al frente', cue: 'Toca el suelo al frente con un pie y vuelve. Alterna lados.', easier: 'Haz el toque muy cerca del cuerpo y usa apoyo.', swapWith: 'knee-lift' },
  reach: { id: 'reach', icon: '🌤️', title: 'Alcances suaves', cue: 'Eleva un brazo y cambia de lado sin forzar el rango.', easier: 'Lleva las manos solo hasta la altura del pecho.', swapWith: 'shoulders' },
  'calf-release': { id: 'calf-release', icon: '🌿', title: 'Soltar pantorrillas', cue: 'Da un paso atrás, apoya el talón y mantén una tensión suave. Cambia de lado.', easier: 'Acorta la distancia entre los pies.', swapWith: 'breathing' },
  breathing: { id: 'breathing', icon: '😌', title: 'Respiración de cierre', cue: 'Baja el ritmo y respira cómodo, sin aguantar el aire.', easier: 'Respira a tu ritmo natural; no necesitas contar.', swapWith: 'calf-release' },
};

const ROUTINE_ORDER: Record<number, string[]> = {
  5: ['shoulders', 'march', 'chair-rise', 'side-step', 'breathing'],
  10: ['shoulders', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'toe-tap', 'reach', 'breathing'],
  20: ['shoulders', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'knee-lift', 'reach', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'toe-tap', 'calf-release', 'breathing'],
  30: ['shoulders', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'knee-lift', 'reach', 'march', 'chair-rise', 'wall-press', 'side-step', 'heel-raise', 'toe-tap', 'march', 'chair-rise', 'wall-press', 'side-step', 'knee-lift', 'reach', 'calf-release', 'breathing'],
};

function supportedDuration(value: number) { if (value <= 5) return 5; if (value <= 10) return 10; if (value <= 20) return 20; return 30; }

export function routineForDuration(value: number): MoveRoutine {
  const targetMinutes = supportedDuration(value);
  const ids = ROUTINE_ORDER[targetMinutes];
  const restAfterSec = targetMinutes <= 5 ? 8 : targetMinutes <= 10 ? 10 : 12;
  const targetSeconds = targetMinutes * 60;
  const restBudget = restAfterSec * Math.max(0, ids.length - 1);
  const exerciseBudget = targetSeconds - restBudget;
  const base = Math.floor(exerciseBudget / ids.length);
  let remaining = exerciseBudget - base * ids.length;
  const steps = ids.map((id, slot) => { const durationSec = base + (remaining > 0 ? 1 : 0); if (remaining > 0) remaining -= 1; return { slot, exercise: EXERCISES[id], durationSec, restAfterSec: slot === ids.length - 1 ? 0 : restAfterSec }; });
  return { id: `move-${targetMinutes}`, targetMinutes, steps, totalSeconds: steps.reduce((sum, step) => sum + step.durationSec + step.restAfterSec, 0) };
}

export function exerciseById(id: string | undefined, fallback: MoveExercise) { return id && EXERCISES[id] ? EXERCISES[id] : fallback; }
export function alternateExercise(exercise: MoveExercise) { return EXERCISES[exercise.swapWith] ?? exercise; }
export function previewForDuration(value: number) { const routine = routineForDuration(value); const unique: MoveExercise[] = []; for (const step of routine.steps) { if (!unique.some((item) => item.id === step.exercise.id)) unique.push(step.exercise); if (unique.length >= 4) break; } return unique; }