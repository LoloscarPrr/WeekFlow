import type { Energy } from '@/src/domain/entities/DailyState';
import type { Shift } from '@/src/domain/entities/Shift';

export type MoveFocus = 'equilibrado' | 'activar' | 'fuerza' | 'movilidad';
export type MoveAvoidArea = 'shoulders' | 'knees' | 'wrists' | 'lowerBack';

export type MovePreferences = {
  focus: MoveFocus;
  floorAllowed: boolean;
  chairAvailable: boolean;
  avoidAreas: MoveAvoidArea[];
};

export const DEFAULT_MOVE_PREFERENCES: MovePreferences = {
  focus: 'equilibrado',
  floorAllowed: false,
  chairAvailable: true,
  avoidAreas: [],
};

export const MOVE_FOCUS_OPTIONS: { value: MoveFocus; label: string; icon: string; copy: string }[] = [
  { value: 'equilibrado', label: 'Equilibrado', icon: '⚖️', copy: 'Un poco de movilidad, activación y fuerza suave.' },
  { value: 'activar', label: 'Activarme', icon: '⚡', copy: 'Más movimiento continuo, siempre a ritmo cómodo.' },
  { value: 'fuerza', label: 'Fuerza suave', icon: '💪', copy: 'Movimientos controlados con tu propio cuerpo o una silla.' },
  { value: 'movilidad', label: 'Movilidad', icon: '🌿', copy: 'Mover articulaciones y bajar rigidez sin buscar intensidad.' },
];

export const MOVE_AVOID_AREA_OPTIONS: { value: MoveAvoidArea; label: string; icon: string }[] = [
  { value: 'shoulders', label: 'Hombros', icon: '🙆' },
  { value: 'knees', label: 'Rodillas', icon: '🦵' },
  { value: 'wrists', label: 'Muñecas', icon: '🤲' },
  { value: 'lowerBack', label: 'Espalda baja', icon: '🧍' },
];

const MOVE_AVOID_AREAS = new Set<MoveAvoidArea>(MOVE_AVOID_AREA_OPTIONS.map((item) => item.value));

function baseMinutes(energy: Energy) {
  if (energy === 'agotado') return 5;
  if (energy === 'cansado') return 10;
  if (energy === 'vigoroso') return 30;
  return 20;
}

function previousDuration(value: number) {
  if (value >= 30) return 20;
  if (value >= 20) return 10;
  return 5;
}

export function recommendMoveMinutes(
  energy: Energy,
  lastFeedback: string | null | undefined,
  shift: Shift,
  lastEndedEarly = false,
) {
  let minutes = baseMinutes(energy);

  if (lastFeedback === 'Demasiado') minutes = previousDuration(previousDuration(minutes));
  else if (lastFeedback === 'Difícil') minutes = previousDuration(minutes);
  else if (lastEndedEarly && !lastFeedback) minutes = previousDuration(minutes);

  if (shift.type !== 'off' && energy !== 'vigoroso' && minutes > 20) minutes = 20;
  return minutes;
}

export function moveRecommendationCopy(
  energy: Energy,
  lastFeedback: string | null | undefined,
  shift: Shift,
  preferences: MovePreferences,
  lastEndedEarly = false,
) {
  if (lastFeedback === 'Demasiado') return 'La última sesión fue demasiado. Hoy reducimos claramente la carga y mantenemos una salida fácil.';
  if (lastFeedback === 'Difícil') return 'La última sesión se sintió difícil, así que hoy bajamos un nivel antes de volver a subir.';
  if (lastEndedEarly && !lastFeedback) return 'La última sesión terminó antes. Hoy proponemos una dosis más corta sin asumir que tengas que compensarla.';
  if (energy === 'agotado') return 'Marcaste poca energía. La propuesta es breve y puedes terminar antes sin perder la sesión.';
  if (energy === 'cansado') return 'Hoy priorizamos una dosis corta que sume sin convertir Move en otra obligación.';
  if (shift.type !== 'off') return `Hay jornada ${shift.start}–${shift.end}. Move se mantiene acotado y con enfoque ${preferences.focus}.`;
  return `Día libre: tienes más margen, pero la duración sigue siendo una propuesta. Enfoque ${preferences.focus}.`;
}

export function sanitizeMovePreferences(value: unknown): MovePreferences {
  if (!value || typeof value !== 'object') return DEFAULT_MOVE_PREFERENCES;
  const candidate = value as Partial<MovePreferences>;
  const focus: MoveFocus = candidate.focus === 'activar' || candidate.focus === 'fuerza' || candidate.focus === 'movilidad'
    ? candidate.focus
    : 'equilibrado';
  const avoidAreas = Array.isArray(candidate.avoidAreas)
    ? candidate.avoidAreas.filter((area): area is MoveAvoidArea => MOVE_AVOID_AREAS.has(area as MoveAvoidArea))
    : [];
  return {
    focus,
    floorAllowed: Boolean(candidate.floorAllowed),
    chairAvailable: candidate.chairAvailable !== false,
    avoidAreas: Array.from(new Set(avoidAreas)),
  };
}
