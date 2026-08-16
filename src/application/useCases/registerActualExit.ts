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

export type CorrectActualExitTimeInput = Omit<RegisterActualExitInput, 'now'> & {
  time: string;
};

function dateAtClosestTime(reference: Date, time: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new Error(`Invalid clock time: ${time}`);

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const candidates = [-1, 0, 1].map((dayOffset) => {
    const candidate = new Date(reference);
    candidate.setDate(candidate.getDate() + dayOffset);
    candidate.setHours(hours, minutes, 0, 0);
    return candidate;
  });

  return candidates.reduce((closest, candidate) => (
    Math.abs(candidate.getTime() - reference.getTime()) < Math.abs(closest.getTime() - reference.getTime())
      ? candidate
      : closest
  ));
}

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

export function correctActualExitTime({
  state,
  shiftKey,
  snapshot,
  currentPlan,
  time,
}: CorrectActualExitTimeInput): RegisterActualExitResult {
  const parsedReference = state.actualExitAt ? new Date(state.actualExitAt) : new Date();
  const reference = Number.isNaN(parsedReference.getTime()) ? new Date() : parsedReference;
  const correctedAt = dateAtClosestTime(reference, time);

  return registerActualExit({
    state,
    shiftKey,
    snapshot,
    currentPlan,
    now: correctedAt,
  });
}
