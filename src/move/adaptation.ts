import type { Energy } from '@/src/domain/entities/DailyState';
import type { Shift } from '@/src/domain/entities/Shift';

export type MoveFocus = 'equilibrado' | 'activar' | 'fuerza' | 'movilidad';
export type MoveAvoidArea = 'shoulders' | 'knees' | 'wrists' | 'lowerBack';
export type MoveExperience = 'sin_definir' | 'principiante' | 'intermedio' | 'avanzado';
export type MoveGoal = 'bienestar' | 'fuerza' | 'musculo' | 'condicion' | 'movilidad';
export type MoveIntensity = 'recuperacion' | 'suave' | 'moderada' | 'alta';
export type MoveEquipmentType = 'dumbbells' | 'kettlebell' | 'band';

export type MoveEquipment = {
  dumbbellsKg: number | null;
  kettlebellKg: number | null;
  resistanceBand: boolean;
};

export type MovePreferences = {
  focus: MoveFocus;
  floorAllowed: boolean;
  chairAvailable: boolean;
  avoidAreas: MoveAvoidArea[];
  experience: MoveExperience;
  goal: MoveGoal;
  weightKg: number | null;
  heightCm: number | null;
  equipment: MoveEquipment;
};

export const DEFAULT_MOVE_EQUIPMENT: MoveEquipment = {
  dumbbellsKg: null,
  kettlebellKg: null,
  resistanceBand: false,
};

export const DEFAULT_MOVE_PREFERENCES: MovePreferences = {
  focus: 'equilibrado',
  floorAllowed: false,
  chairAvailable: true,
  avoidAreas: [],
  experience: 'sin_definir',
  goal: 'bienestar',
  weightKg: null,
  heightCm: null,
  equipment: DEFAULT_MOVE_EQUIPMENT,
};

export const MOVE_FOCUS_OPTIONS: { value: MoveFocus; label: string; icon: string; copy: string }[] = [
  { value: 'equilibrado', label: 'Equilibrado', icon: '⚖️', copy: 'Combina movilidad, activación y fuerza general sin ir a un extremo.' },
  { value: 'activar', label: 'Activarme', icon: '⚡', copy: 'Movimiento continuo y dinámico para subir el ritmo de forma progresiva.' },
  { value: 'fuerza', label: 'Fuerza', icon: '💪', copy: 'Fuerza general controlada con tu cuerpo y el equipo que realmente tengas.' },
  { value: 'movilidad', label: 'Movilidad', icon: '🌿', copy: 'Mover articulaciones y soltar rigidez con rango cómodo y baja intensidad.' },
];

export const MOVE_AVOID_AREA_OPTIONS: { value: MoveAvoidArea; label: string; icon: string }[] = [
  { value: 'shoulders', label: 'Hombros', icon: '🙆' },
  { value: 'knees', label: 'Rodillas', icon: '🦵' },
  { value: 'wrists', label: 'Muñecas', icon: '🤲' },
  { value: 'lowerBack', label: 'Espalda baja', icon: '🧍' },
];

export const MOVE_EXPERIENCE_OPTIONS: { value: MoveExperience; label: string }[] = [
  { value: 'sin_definir', label: 'Sin definir' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export const MOVE_GOAL_OPTIONS: { value: MoveGoal; label: string }[] = [
  { value: 'bienestar', label: 'Bienestar' },
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'musculo', label: 'Músculo' },
  { value: 'condicion', label: 'Condición' },
  { value: 'movilidad', label: 'Movilidad' },
];

export const MOVE_INTENSITY_LABELS: Record<MoveIntensity, string> = {
  recuperacion: 'Recuperación',
  suave: 'Suave',
  moderada: 'Moderada',
  alta: 'Alta',
};

export const MOVE_INTENSITY_RANK: Record<MoveIntensity, number> = {
  recuperacion: 0,
  suave: 1,
  moderada: 2,
  alta: 3,
};

export const MOVE_EXPERIENCE_RANK: Record<MoveExperience, number> = {
  sin_definir: 99,
  principiante: 0,
  intermedio: 1,
  avanzado: 2,
};

const MOVE_AVOID_AREAS = new Set<MoveAvoidArea>(MOVE_AVOID_AREA_OPTIONS.map((item) => item.value));
const MOVE_EXPERIENCES = new Set<MoveExperience>(MOVE_EXPERIENCE_OPTIONS.map((item) => item.value));
const MOVE_GOALS = new Set<MoveGoal>(MOVE_GOAL_OPTIONS.map((item) => item.value));

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

function previousIntensity(value: MoveIntensity): MoveIntensity {
  if (value === 'alta') return 'moderada';
  if (value === 'moderada') return 'suave';
  if (value === 'suave') return 'recuperacion';
  return 'recuperacion';
}

function normalizedNumber(value: unknown, min: number, max: number) {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value.replace(',', '.'))
      : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return Math.round(parsed * 100) / 100;
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

export function recommendMoveIntensity(
  energy: Energy,
  experience: MoveExperience,
  lastFeedback: string | null | undefined,
  lastEndedEarly = false,
): MoveIntensity {
  let intensity: MoveIntensity;
  if (energy === 'agotado') intensity = 'recuperacion';
  else if (energy === 'cansado') intensity = 'suave';
  else if (energy === 'vigoroso' && (experience === 'intermedio' || experience === 'avanzado')) intensity = 'alta';
  else intensity = 'moderada';

  if (lastFeedback === 'Demasiado') return 'recuperacion';
  if (lastFeedback === 'Difícil') return previousIntensity(intensity);
  if (lastEndedEarly && !lastFeedback) return previousIntensity(intensity);
  return intensity;
}

export function moveEquipmentAvailable(type: MoveEquipmentType, preferences: MovePreferences) {
  if (type === 'dumbbells') return typeof preferences.equipment.dumbbellsKg === 'number' && preferences.equipment.dumbbellsKg > 0;
  if (type === 'kettlebell') return typeof preferences.equipment.kettlebellKg === 'number' && preferences.equipment.kettlebellKg > 0;
  return preferences.equipment.resistanceBand;
}

export function moveEquipmentLabel(type: MoveEquipmentType, preferences: MovePreferences) {
  if (type === 'dumbbells' && moveEquipmentAvailable(type, preferences)) return `Mancuernas · ${preferences.equipment.dumbbellsKg} kg c/u`;
  if (type === 'kettlebell' && moveEquipmentAvailable(type, preferences)) return `Kettlebell · ${preferences.equipment.kettlebellKg} kg`;
  if (type === 'band' && moveEquipmentAvailable(type, preferences)) return 'Banda de resistencia';
  return null;
}

/**
 * Contextual ratio only. It is intentionally not a safety score, strength class,
 * BMI surrogate or body-type label. It is used only to moderate how often
 * external-load variants are prioritised in a session.
 */
export function declaredExternalLoadRatio(preferences: MovePreferences) {
  if (!preferences.weightKg || preferences.weightKg <= 0) return null;
  const loads: number[] = [];
  if (moveEquipmentAvailable('dumbbells', preferences) && preferences.equipment.dumbbellsKg) {
    loads.push(preferences.equipment.dumbbellsKg * 2);
  }
  if (moveEquipmentAvailable('kettlebell', preferences) && preferences.equipment.kettlebellKg) {
    loads.push(preferences.equipment.kettlebellKg);
  }
  if (!loads.length) return null;
  return Math.max(...loads) / preferences.weightKg;
}

export function moveRecommendationCopy(
  energy: Energy,
  lastFeedback: string | null | undefined,
  shift: Shift,
  preferences: MovePreferences,
  lastEndedEarly = false,
) {
  const intensity = MOVE_INTENSITY_LABELS[recommendMoveIntensity(energy, preferences.experience, lastFeedback, lastEndedEarly)].toLowerCase();
  if (lastFeedback === 'Demasiado') return 'La última sesión fue demasiado. Hoy reducimos claramente carga y densidad, con más recuperación entre esfuerzos.';
  if (lastFeedback === 'Difícil') return 'La última sesión se sintió difícil, así que hoy bajamos un nivel de intensidad antes de volver a subir.';
  if (lastEndedEarly && !lastFeedback) return 'La última sesión terminó antes. Hoy proponemos una dosis más corta y menos densa, sin asumir que tengas que compensarla.';
  if (energy === 'agotado') return 'Marcaste poca energía. La propuesta usa intensidad de recuperación y puedes terminar antes sin perder la sesión.';
  if (energy === 'cansado') return 'Hoy priorizamos una sesión suave, con más recuperación entre bloques para que sume sin convertirse en otra obligación.';
  if (shift.type !== 'off') return `Hay jornada ${shift.start}–${shift.end}. Move queda acotado, con intensidad ${intensity} y enfoque ${preferences.focus}.`;
  return `Día libre: tienes más margen, pero la duración sigue siendo una propuesta. Intensidad ${intensity} · enfoque ${preferences.focus}.`;
}

export function sanitizeMovePreferences(value: unknown): MovePreferences {
  if (!value || typeof value !== 'object') return DEFAULT_MOVE_PREFERENCES;
  const candidate = value as Partial<MovePreferences> & { equipment?: Partial<MoveEquipment> };
  const focus: MoveFocus = candidate.focus === 'activar' || candidate.focus === 'fuerza' || candidate.focus === 'movilidad'
    ? candidate.focus
    : 'equilibrado';
  const avoidAreas = Array.isArray(candidate.avoidAreas)
    ? candidate.avoidAreas.filter((area): area is MoveAvoidArea => MOVE_AVOID_AREAS.has(area as MoveAvoidArea))
    : [];
  const experience = MOVE_EXPERIENCES.has(candidate.experience as MoveExperience)
    ? candidate.experience as MoveExperience
    : 'sin_definir';
  const goal = MOVE_GOALS.has(candidate.goal as MoveGoal)
    ? candidate.goal as MoveGoal
    : 'bienestar';
  const equipment: Partial<MoveEquipment> = candidate.equipment && typeof candidate.equipment === 'object'
    ? candidate.equipment as Partial<MoveEquipment>
    : {};

  return {
    focus,
    floorAllowed: Boolean(candidate.floorAllowed),
    chairAvailable: candidate.chairAvailable !== false,
    avoidAreas: Array.from(new Set(avoidAreas)),
    experience,
    goal,
    weightKg: normalizedNumber(candidate.weightKg, 1, 500),
    heightCm: normalizedNumber(candidate.heightCm, 50, 260),
    equipment: {
      dumbbellsKg: normalizedNumber(equipment.dumbbellsKg, 0.25, 200),
      kettlebellKg: normalizedNumber(equipment.kettlebellKg, 0.25, 200),
      resistanceBand: Boolean(equipment.resistanceBand),
    },
  };
}
