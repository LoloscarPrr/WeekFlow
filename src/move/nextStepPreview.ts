import type { MovePreferences } from './adaptation';
import {
  exerciseById,
  moveExerciseEquipmentLabel,
  type MoveStep,
} from './library';

export type MoveNextStepPreview = {
  title: string;
  detail: string;
  instruction: string;
  equipment: string | null;
  circuit: Array<{ id: string; title: string; repsLabel: string }>;
};

function formatUpcomingDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Read-only preview for the rest phase. It uses the actual following step,
 * including a previously saved exercise swap, without modifying the workout.
 */
export function getMoveNextStepPreview(
  steps: readonly MoveStep[],
  currentStepIndex: number,
  preferences: MovePreferences,
  exerciseOverrides: Readonly<Record<string, string>> = {},
): MoveNextStepPreview | null {
  if (!Number.isInteger(currentStepIndex) || currentStepIndex < 0) return null;
  const nextIndex = currentStepIndex + 1;
  const next = steps[nextIndex];
  if (!next) return null;

  if (next.mode === 'amrap') {
    return {
      title: 'Circuito AMRAP',
      detail: `Ronda ${next.roundNumber ?? 1} de ${next.roundCount ?? 1} · ${formatUpcomingDuration(next.durationSec)}`,
      instruction: 'Prepara los movimientos de la próxima ronda a tu propio ritmo.',
      equipment: null,
      circuit: (next.circuit ?? []).map((item) => ({
        id: item.exercise.id,
        title: item.exercise.title,
        repsLabel: item.repsLabel,
      })),
    };
  }

  const exercise = exerciseById(exerciseOverrides[String(nextIndex)], next.exercise);
  return {
    title: exercise.title,
    detail: next.mode === 'set'
      ? `Serie ${next.setNumber ?? 1} de ${next.setCount ?? 1} · ${next.repsLabel ?? '—'} repeticiones`
      : `Trabajo · ${formatUpcomingDuration(next.durationSec)}`,
    instruction: exercise.cue,
    equipment: moveExerciseEquipmentLabel(exercise, preferences),
    circuit: [],
  };
}
