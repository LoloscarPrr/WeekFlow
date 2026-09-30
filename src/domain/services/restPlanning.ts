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

export type RestNapSuggestion = {
  startAt: Date;
  endAt: Date;
  durationMin: 20 | 30;
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

export function contextualNapSuggestion(
  dayState: DayState,
  restWindow: RestWindow,
  now = new Date(),
): RestNapSuggestion | null {
  if (dayState.energy !== 'cansado' && dayState.energy !== 'agotado') return null;

  // If the protected main sleep window has already started, Rest should not
  // replace it with a short nap suggestion.
  if (now >= restWindow.sleepAt && now < restWindow.wakeAt) return null;

  const durationMin: 20 | 30 = dayState.energy === 'agotado' ? 30 : 20;
  const startAt = addDateMinutes(now, 15);
  const endAt = addDateMinutes(startAt, durationMin);

  // Keep a generous buffer before the planned main sleep window so a short
  // pause never competes with the principal rest plan.
  if (restWindow.sleepAt > now) {
    const minutesUntilMainSleep = (restWindow.sleepAt.getTime() - now.getTime()) / 60_000;
    if (minutesUntilMainSleep < 180) return null;
    if (endAt > addDateMinutes(restWindow.sleepAt, -120)) return null;
  }

  // Also keep the suggestion well away from the moment the user needs to be
  // awake for the next shift. This stays deliberately conservative.
  if (endAt > addDateMinutes(restWindow.wakeAt, -90)) return null;

  return { startAt, endAt, durationMin };
}
