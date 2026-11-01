import type { WeekSchedule } from '../domain/entities/Shift';
import { migrateWeekSchedule } from '../data/migrations/stateMigrations';
import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import { sqliteWeekScheduleRepository, WEEK_STATE_KEY } from '../data/repositories/SQLiteWeekScheduleRepository';
import {
  addWeek, advanceWeekWindow, emptyWeek, mondayKey, nextWeekSchedule,
  type WeekWindow,
} from '../domain/services/weekWindow';

const WINDOW_KEY = 'week-window-v1';

function storedWindow(value: unknown): WeekWindow | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<WeekWindow>;
  if (typeof item.currentMonday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.currentMonday)) return null;
  const next = item.next && typeof item.next.weekStart === 'string' && item.next.week
    ? { weekStart: item.next.weekStart, week: migrateWeekSchedule(item.next.week) } : null;
  const previous = item.previous && typeof item.previous.weekStart === 'string' && item.previous.week
    ? { weekStart: item.previous.weekStart, week: migrateWeekSchedule(item.previous.week) } : null;
  return { currentMonday: item.currentMonday, next, previous };
}
function readWindow(at = new Date()): { window: WeekWindow; current: WeekSchedule } {
  // Continue to use the original SQLite key for legacy consumers and imports.
  const current = sqliteWeekScheduleRepository.load();
  let window = storedWindow(sqliteStateStore.read<unknown>(WINDOW_KEY));
  if (!window) {
    window = { currentMonday: mondayKey(at), next: null, previous: null };
    sqliteStateStore.write(WINDOW_KEY, window);
  }
  const rolled = advanceWeekWindow(window, current, at);
  if (rolled.rotated) {
    // Both canonical current-week data and the anchored window must change together.
    sqliteStateStore.writeBatch([
      { key: WEEK_STATE_KEY, value: rolled.current },
      { key: WINDOW_KEY, value: rolled.window },
    ]);
  }
  return { window: rolled.window, current: rolled.current };
}
export function loadCurrentWeek(at = new Date()): WeekSchedule {
  return readWindow(at).current;
}
export function saveCurrentWeek(week: WeekSchedule, at = new Date()): void {
  readWindow(at);
  sqliteWeekScheduleRepository.save(week);
}
export function loadWeekForOffset(offset: 0 | 1, at = new Date()): WeekSchedule {
  const { window, current } = readWindow(at);
  return offset === 0 ? current : nextWeekSchedule(window, current);
}
export function hasPreparedNextWeek(at = new Date()): boolean {
  const { window } = readWindow(at);
  return window.next?.weekStart === addWeek(window.currentMonday);
}
export function saveWeekForOffset(offset: 0 | 1, week: WeekSchedule, at = new Date()): void {
  if (offset === 0) { saveCurrentWeek(week, at); return; }
  const { window, current } = readWindow(at);
  const nextMonday = addWeek(window.currentMonday);
  const updated: WeekWindow = {
    ...window,
    next: { weekStart: nextMonday, week: { ...week, importantMoments: current.importantMoments } },
  };
  sqliteStateStore.write(WINDOW_KEY, updated);
}
export function loadWeekForDate(date: Date, now = new Date()): WeekSchedule {
  const { window, current } = readWindow(now);
  const weekStart = mondayKey(date);
  if (weekStart === window.currentMonday) return current;
  if (weekStart === addWeek(window.currentMonday)) return nextWeekSchedule(window, current);
  if (window.previous?.weekStart === weekStart) return window.previous.week;
  // Unspecified dates never inherit arbitrary shifts.
  return emptyWeek(current.importantMoments);
}
export function loadPreviousWeek(at = new Date()): WeekSchedule | null {
  const { window } = readWindow(at);
  return window.previous?.weekStart === addWeek(window.currentMonday, -1)
    ? window.previous.week : null;
}
