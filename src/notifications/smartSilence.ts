import type { DayState } from '../domain/entities/DailyState';
import type { Shift, WeekSchedule } from '../domain/entities/Shift';
import { localDateKey } from '../domain/services/shiftSchedule';
import { restWindowForShift } from '../domain/services/restPlanning';
import type { NotificationPreferences } from './core';

export type SmartSilenceReminderKind =
  | 'important'
  | 'departure'
  | 'rest'
  | 'food'
  | 'move'
  | 'general';

export type ProtectedRestWindow = {
  startsAt: Date;
  endsAt: Date;
  nextShiftAt: Date;
};

export type InterruptionDecision = {
  allowed: boolean;
  reason:
    | 'smart-silence-off'
    | 'outside-protected-rest'
    | 'explicit-priority'
    | 'protected-rest';
};

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

function shiftForCalendarDate(week: WeekSchedule, date: Date): Shift {
  const day = mondayBasedDay(date);
  const stored = week.shifts.find((item) => item.day === day);
  if (!stored) return { start: '', end: '', type: 'off' };
  return { start: stored.start, end: stored.end, type: stored.type };
}

function localDateTime(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function buildProtectedRestWindows(
  dayState: DayState,
  week: WeekSchedule,
  now = new Date(),
  horizonDays = 14,
): ProtectedRestWindow[] {
  const windows: ProtectedRestWindow[] = [];
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + horizonDays);

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    const shift = shiftForCalendarDate(week, date);
    if (shift.type === 'off' || !shift.start) continue;

    const startsAt = localDateTime(localDateKey(date), shift.start);
    if (startsAt <= now || startsAt > horizon) continue;

    const rest = restWindowForShift(dayState, shift, startsAt);
    if (!rest) continue;

    windows.push({
      startsAt: rest.sleepAt,
      endsAt: rest.wakeAt,
      nextShiftAt: startsAt,
    });
  }

  return windows.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function nextProtectedRestWindow(
  dayState: DayState,
  week: WeekSchedule,
  now = new Date(),
): ProtectedRestWindow | null {
  return buildProtectedRestWindows(dayState, week, now)
    .find((window) => window.endsAt > now) ?? null;
}

function insideProtectedRest(at: Date, windows: ProtectedRestWindow[]) {
  return windows.some((window) => at >= window.startsAt && at < window.endsAt);
}

export function interruptionDecision(
  preferences: NotificationPreferences,
  kind: SmartSilenceReminderKind,
  at: Date,
  windows: ProtectedRestWindow[],
): InterruptionDecision {
  if (!preferences.smartSilence) {
    return { allowed: true, reason: 'smart-silence-off' };
  }

  if (!insideProtectedRest(at, windows)) {
    return { allowed: true, reason: 'outside-protected-rest' };
  }

  if (kind === 'important' || kind === 'departure' || kind === 'rest') {
    return { allowed: true, reason: 'explicit-priority' };
  }

  return { allowed: false, reason: 'protected-rest' };
}
