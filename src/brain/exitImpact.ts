import { addMinutes, timeConstants, toMinutes } from '@/src/domain/services/time';
import type { BrainPlan, BrainSnapshot } from './types';

function actualExitDelta(snapshot: BrainSnapshot, actualExit: string) {
  const start = toMinutes(snapshot.shift.start);
  let plannedEnd = toMinutes(snapshot.shift.end);
  let actual = toMinutes(actualExit);
  const overnight = plannedEnd <= start;

  if (overnight) {
    plannedEnd += timeConstants.dayMinutes;
    if (actual < start) actual += timeConstants.dayMinutes;
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

  // Regreso, descompresión y Rest siguen la realidad sin pedir permiso.
  // La confirmación existe solo cuando una salida muy distinta obligaría a
  // mover decisiones flexibles del usuario.
  const requiresConfirmation = flexibleCount > 0 && (
    absoluteDelta >= 60
    || (affectsRest && absoluteDelta >= 45)
  );

  return {
    deltaMinutes,
    homeAt: addMinutes(actualExit, snapshot.commuteBackMin),
    recoveryAt: addMinutes(actualExit, snapshot.commuteBackMin + snapshot.recoveryMin),
    flexibleCount,
    affectsRest,
    requiresConfirmation,
  };
}
