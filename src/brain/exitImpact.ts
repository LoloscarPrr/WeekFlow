import type { BrainPlan, BrainSnapshot } from './types';

const DAY = 24 * 60;

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(value: number) {
  const normalized = ((value % DAY) + DAY) % DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function addMinutes(time: string, amount: number) {
  return formatMinutes(toMinutes(time) + amount);
}

function actualExitDelta(snapshot: BrainSnapshot, actualExit: string) {
  const start = toMinutes(snapshot.shift.start);
  let plannedEnd = toMinutes(snapshot.shift.end);
  let actual = toMinutes(actualExit);
  const overnight = plannedEnd <= start;

  if (overnight) {
    plannedEnd += DAY;
    if (actual < start) actual += DAY;
  }

  return actual - plannedEnd;
}

export type ExitReplanImpact = {
  deltaMinutes: number;
  homeAt: string;
  recoveryAt: string;
  flexibleCount: number;
  affectsRest: boolean;
  requiresConfirmation: boolean;
};

export function assessExitReplanImpact(
  snapshot: BrainSnapshot,
  currentPlan: BrainPlan,
  actualExit: string,
): ExitReplanImpact {
  if (snapshot.shift.type === 'off') {
    return {
      deltaMinutes: 0,
      homeAt: actualExit,
      recoveryAt: actualExit,
      flexibleCount: 0,
      affectsRest: false,
      requiresConfirmation: false,
    };
  }

  const commuteBackIndex = currentPlan.moments.findIndex((item) => item.type === 'commute-back');
  const afterShift = commuteBackIndex >= 0 ? currentPlan.moments.slice(commuteBackIndex + 1) : [];
  const flexibleCount = afterShift.filter(
    (item) => item.flexible && ['food', 'move', 'personal'].includes(item.type),
  ).length;
  const affectsRest = currentPlan.mode === 'night-shift' && afterShift.some((item) => item.type === 'rest');
  const deltaMinutes = actualExitDelta(snapshot, actualExit);
  const absoluteDelta = Math.abs(deltaMinutes);

  // Reality updates commute/recovery immediately. We only ask before moving
  // flexible life blocks when the change is materially large, or when a night
  // shift meaningfully moves the protected recovery window.
  const requiresConfirmation =
    (flexibleCount > 0 && absoluteDelta >= 60)
    || (affectsRest && absoluteDelta >= 45)
    || absoluteDelta >= 120;

  return {
    deltaMinutes,
    homeAt: addMinutes(actualExit, snapshot.commuteBackMin),
    recoveryAt: addMinutes(actualExit, snapshot.commuteBackMin + snapshot.recoveryMin),
    flexibleCount,
    affectsRest,
    requiresConfirmation,
  };
}
