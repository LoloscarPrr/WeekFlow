export type MoveProgressionContext = {
  lastFeedback?: string | null;
  lastEndedEarly?: boolean;
  previousExerciseIds?: string[];
};

export function moveFeedbackDifficultyDelta(
  feedback: string | null | undefined,
  endedEarly = false,
) {
  if (feedback === 'Muy fácil') return 1;
  if (feedback === 'Difícil') return -1;
  if (feedback === 'Demasiado') return -2;
  if (endedEarly && !feedback) return -1;
  return 0;
}

export function clampMoveDifficulty(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}
