import { assessExitReplanImpact } from '@/src/brain/exitImpact';
import type { BrainPlan, BrainSnapshot } from '@/src/domain/entities/Planning';
import type { DayState } from '@/src/domain/entities/DailyState';

function currentHm(now: Date) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export type RegisterActualExitInput = {
  state: DayState;
  shiftKey: string;
  snapshot: BrainSnapshot;
  currentPlan: BrainPlan;
  now?: Date;
};

export type RegisterActualExitResult = {
  state: DayState;
  recordedAt: Date;
  requiresConfirmation: boolean;
};

export function registerActualExit({
  state,
  shiftKey,
  snapshot,
  currentPlan,
  now = new Date(),
}: RegisterActualExitInput): RegisterActualExitResult {
  const actualExit = currentHm(now);
  const impact = assessExitReplanImpact(snapshot, currentPlan, actualExit);

  return {
    recordedAt: now,
    requiresConfirmation: impact.requiresConfirmation,
    state: {
      ...state,
      actualExit,
      actualExitAt: now.toISOString(),
      actualExitShiftKey: shiftKey,
      actualExitReplanConfirmed: !impact.requiresConfirmation,
    },
  };
}
