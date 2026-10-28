import type { WeeklyMoveSlot } from '@/src/brain/weeklyPlanner';

/** Preserve the original confirmed-plan display order and today's completed flag. */
export function nextConfirmedMoveSlot(
  moveSlots: ReadonlyArray<WeeklyMoveSlot>,
  todayKey: string,
  doneToday: boolean,
): WeeklyMoveSlot | undefined {
  return moveSlots.find((slot) => slot.date > todayKey || (slot.date === todayKey && !doneToday));
}
