// Objetivos musculares de Move: lista cerrada y compartida por UI, Brain y rutinas.
export const MOVE_MUSCLE_GROUPS = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'piernas', 'gluteos', 'core'] as const;
export type MoveMuscleGroup = typeof MOVE_MUSCLE_GROUPS[number];
export const MOVE_MUSCLE_LABELS: Record<MoveMuscleGroup, string> = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', piernas: 'Piernas',
  gluteos: 'Glúteos', core: 'Abdominales / core',
};
export const MOVE_MUSCLE_EXERCISE_IDS: Record<MoveMuscleGroup, readonly string[]> = {
  pecho: ['wall-press', 'incline-push', 'knee-pushup', 'pushup', 'db-floor-press', 'db-bench-press', 'machine-chest-press', 'barbell-bench-press', 'db-incline-press', 'suspension-push', 'db-neutral-press', 'band-chest-press', 'db-chest-fly-floor'],
  espalda: ['standing-scapular-retraction', 'band-row', 'seated-band-row', 'cable-row', 'machine-row', 'db-row', 'band-pulldown', 'lat-pulldown', 'assisted-pullup', 'suspension-row', 'pullup', 'barbell-row', 'db-rear-delt-fly', 'band-face-pull'],
  hombros: ['shoulders', 'reach', 'band-overhead-press', 'db-shoulder-press', 'machine-shoulder-press', 'kb-single-arm-press', 'band-pull-apart', 'kb-front-raise', 'db-rear-delt-fly', 'band-face-pull', 'db-lateral-raise', 'band-lateral-raise'],
  biceps: ['self-resisted-biceps-curl', 'db-biceps-curl', 'barbell-biceps-curl', 'suspension-biceps-curl', 'db-hammer-curl', 'band-biceps-curl'],
  triceps: ['wall-press', 'incline-push', 'band-triceps-extension', 'cable-triceps-extension', 'db-triceps-extension', 'parallel-dip', 'barbell-close-grip-press', 'db-kickback'],
  piernas: ['chair-rise', 'squat', 'supported-split-squat', 'reverse-lunge', 'step-up', 'heel-raise', 'db-goblet-squat', 'machine-leg-press', 'machine-leg-curl', 'band-hamstring-curl', 'seated-knee-extension', 'band-lateral-walk'],
  gluteos: ['bridge', 'hip-hinge', 'reverse-lunge', 'step-up', 'kb-deadlift', 'db-rdl', 'hip-thrust-bench', 'barbell-rdl', 'db-glute-bridge', 'band-glute-bridge', 'side-leg-raise', 'band-lateral-walk'],
  core: ['standing-core-brace', 'dead-bug', 'bird-dog', 'plank-knees', 'plank', 'side-plank-knees', 'side-plank', 'band-pallof', 'cable-pallof', 'hollow-hold', 'heel-slide-core', 'seated-knee-lift-core', 'db-suitcase-march'],
};
export function sanitizeTargetMuscles(value: unknown): MoveMuscleGroup[] {
  if (!Array.isArray(value)) return [];
  return MOVE_MUSCLE_GROUPS.filter((group) => value.includes(group));
}
export function describeTargetMuscles(groups: readonly MoveMuscleGroup[]) {
  return groups.length ? groups.map((g) => MOVE_MUSCLE_LABELS[g]).join(' + ') : 'Cuerpo completo';
}
