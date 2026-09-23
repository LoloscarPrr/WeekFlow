import { buildBrainPlan } from '../../brain/engine';
import type { DayState } from '../entities/DailyState';
import type { BrainSnapshot } from '../entities/Planning';
import type { Shift } from '../entities/Shift';

export type RestWindow = {
  nextStart: Date;
  wakeAt: Date;
  sleepAt: Date;
  windDownAt: Date;
  shift: Shift;
};

export function addDateMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function dateForClockNearStart(startAt: Date, clock: string) {
  const [hours, minutes] = clock.split(':').map(Number);
  const date = new Date(startAt);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > startAt.getTime()) date.setDate(date.getDate() - 1);
  return date;
}

export function restWindowForShift(dayState: DayState, shift: Shift, startAt: Date): RestWindow | null {
  const snapshot: BrainSnapshot = {
    ...dayState.settings,
    shift,
    energy: dayState.energy,
  };
  const plan = buildBrainPlan(snapshot);
  const wake = plan.moments.find((item) => item.type === 'wake');
  if (!wake) return null;

  const wakeAt = dateForClockNearStart(startAt, wake.time);
  const sleepAt = addDateMinutes(wakeAt, -8 * 60);
  const windDownAt = addDateMinutes(sleepAt, -45);
  return { nextStart: new Date(startAt), wakeAt, sleepAt, windDownAt, shift };
}
