import type { WeekSchedule } from '../entities/Shift';
import { defaultWeekState } from '../defaults';
import { localDateKeyForWeekday, parseLocalDateKey } from './calendarDate';

export type AnchoredWeek = { weekStart: string; week: WeekSchedule };
export type WeekWindow = {
  currentMonday: string;
  next: AnchoredWeek | null;
  previous: AnchoredWeek | null;
};

export function mondayKey(date: Date): string {
  return localDateKeyForWeekday(0, date);
}
export function addWeek(monday: string, weeks = 1): string {
  const date = parseLocalDateKey(monday);
  if (!date) return monday;
  date.setDate(date.getDate() + 7 * weeks);
  return mondayKey(date);
}
export function emptyWeek(moments: WeekSchedule['importantMoments'] = []): WeekSchedule {
  return {
    ...defaultWeekState,
    shifts: defaultWeekState.shifts.map(shift => ({ ...shift })),
    importantMoments: [...moments],
    organizedAt: null,
    source: 'manual',
  };
}
function preserveDatedMoments(...weeks: WeekSchedule[]): WeekSchedule['importantMoments'] {
  const map = new Map<string, WeekSchedule['importantMoments'][number]>();
  for (const week of weeks) for (const moment of week.importantMoments) map.set(moment.id, moment);
  return [...map.values()].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
/** Pure, deterministic rollover; no repetition of stale shifts if next was not prepared. */
export function advanceWeekWindow(
  window: WeekWindow,
  current: WeekSchedule,
  now: Date,
): { window: WeekWindow; current: WeekSchedule; rotated: boolean } {
  const target = mondayKey(now);
  if (window.currentMonday >= target) return { window, current, rotated: false };
  const prepared = window.next?.weekStart === target ? window.next.week : null;
  const next = prepared ? { ...prepared } : emptyWeek();
  const promoted: WeekSchedule = {
    ...next,
    importantMoments: preserveDatedMoments(current, next),
    // A prepared next-week roster is already organized: no second Monday ritual.
    organizedAt: prepared ? (prepared.organizedAt ?? now.toISOString()) : null,
  };
  return {
    current: promoted, rotated: true,
    window: {
      currentMonday: target,
      next: null,
      // Only retain one previous week for a Sunday overnight shift on Monday.
      previous: window.currentMonday === addWeek(target, -1)
        ? { weekStart: window.currentMonday, week: current }
        : null,
    },
  };
}
export function nextWeekSchedule(window: WeekWindow, current: WeekSchedule): WeekSchedule {
  const key = addWeek(window.currentMonday);
  const stored = window.next?.weekStart === key ? window.next.week : emptyWeek();
  return { ...stored, importantMoments: preserveDatedMoments(current, stored) };
}
