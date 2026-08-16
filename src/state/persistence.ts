import {
  loadDayState as loadDayStateUseCase,
  loadUserProfile as loadUserProfileUseCase,
  loadWeekSchedule as loadWeekScheduleUseCase,
  saveDayState as saveDayStateUseCase,
  saveUserProfile as saveUserProfileUseCase,
  saveWeekSchedule as saveWeekScheduleUseCase,
} from '@/src/application/useCases/coreState';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { sqliteDayStateRepository } from '@/src/data/repositories/SQLiteDayStateRepository';
import { sqliteUserProfileRepository } from '@/src/data/repositories/SQLiteUserProfileRepository';
import { sqliteWeekScheduleRepository } from '@/src/data/repositories/SQLiteWeekScheduleRepository';
import {
  defaultDayState,
  defaultUserProfile,
  defaultWeekState,
} from '@/src/domain/defaults';
import type { DaySettings as DomainDaySettings, DayState } from '@/src/domain/entities/DailyState';
import type { Shift, WeekSchedule, WeekShift } from '@/src/domain/entities/Shift';
import type { UserProfile as DomainUserProfile } from '@/src/domain/entities/UserProfile';
import {
  correctFoodEntryTime,
  type FoodDayRecord,
  type FoodEntry,
} from '@/src/food/history';
import {
  localDateKey,
  nextWorkingShift as nextWorkingShiftDomain,
  shiftContextForDate as shiftContextForDateDomain,
  shiftForDate as shiftForDateDomain,
  type ShiftContext,
  type UpcomingShift,
} from '@/src/domain/services/shiftSchedule';

const MOVE_HISTORY_KEY = 'move-history';
const MOVE_ACTIVE_KEY = 'move-active-session';
const FOOD_HISTORY_KEY = 'food-history';

// Compatibility aliases for existing screens. New code should import these
// concepts from src/domain rather than from this persistence facade.
export type DaySettings = DomainDaySettings;
export type PersistedDayState = DayState;
export type PersistedWeekShift = WeekShift;
export type PersistedWeekState = WeekSchedule;
export type UserProfile = DomainUserProfile;
export type { ShiftContext, UpcomingShift };

export { defaultDayState, defaultUserProfile, defaultWeekState, localDateKey };

export type MoveSessionRecord = {
  id: string;
  startedAt: string;
  finishedAt: string;
  plannedMinutes: number;
  actualSeconds?: number;
  completedSteps: number;
  totalSteps: number;
  endedEarly: boolean;
  feedback: string | null;
};

export type ActiveMoveSession = {
  id: string;
  startedAt: string;
  plannedMinutes: number;
  step: number;
  totalSteps: number;
  paused: boolean;
  pausedAt: string | null;
  pausedTotalMs: number;
};

export type { FoodDayRecord, FoodEntry } from '@/src/food/history';

export function loadDayState(): PersistedDayState {
  return loadDayStateUseCase(sqliteDayStateRepository);
}

export function saveDayState(state: PersistedDayState) {
  saveDayStateUseCase(sqliteDayStateRepository, state);
}

export function loadWeekState(): PersistedWeekState {
  return loadWeekScheduleUseCase(sqliteWeekScheduleRepository);
}

export function saveWeekState(state: PersistedWeekState) {
  saveWeekScheduleUseCase(sqliteWeekScheduleRepository, state);
}

export function loadUserProfile(): UserProfile {
  return loadUserProfileUseCase(sqliteUserProfileRepository);
}

export function saveUserProfile(profile: UserProfile) {
  saveUserProfileUseCase(sqliteUserProfileRepository, profile);
}

export function loadMoveHistory(): MoveSessionRecord[] {
  const parsed = sqliteStateStore.read<MoveSessionRecord[]>(MOVE_HISTORY_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveMoveSession(record: MoveSessionRecord) {
  const history = loadMoveHistory().filter((item) => item.id !== record.id);
  sqliteStateStore.write(MOVE_HISTORY_KEY, [record, ...history].slice(0, 30));
}

export function loadActiveMoveSession(): ActiveMoveSession | null {
  const parsed = sqliteStateStore.read<Partial<ActiveMoveSession>>(MOVE_ACTIVE_KEY);
  if (!parsed?.id || !parsed.startedAt || typeof parsed.plannedMinutes !== 'number') return null;
  return {
    id: parsed.id,
    startedAt: parsed.startedAt,
    plannedMinutes: parsed.plannedMinutes,
    step: typeof parsed.step === 'number' ? parsed.step : 0,
    totalSteps: typeof parsed.totalSteps === 'number' ? parsed.totalSteps : 1,
    paused: Boolean(parsed.paused),
    pausedAt: typeof parsed.pausedAt === 'string' ? parsed.pausedAt : null,
    pausedTotalMs: typeof parsed.pausedTotalMs === 'number' ? parsed.pausedTotalMs : 0,
  };
}

export function saveActiveMoveSession(session: ActiveMoveSession) {
  sqliteStateStore.write(MOVE_ACTIVE_KEY, session);
}

export function clearActiveMoveSession() {
  sqliteStateStore.delete(MOVE_ACTIVE_KEY);
}

export function moveSessionDoneToday(date = new Date()) {
  const key = localDateKey(date);
  return loadMoveHistory().some((item) => localDateKey(new Date(item.finishedAt)) === key);
}

export function loadFoodHistory(): FoodDayRecord[] {
  const parsed = sqliteStateStore.read<FoodDayRecord[]>(FOOD_HISTORY_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function loadFoodDay(date = new Date()): FoodDayRecord {
  const key = localDateKey(date);
  const existing = loadFoodHistory().find((item) => item.date === key);
  return existing ?? { date: key, entries: [] };
}

export function saveFoodEntry(entry: FoodEntry, date = new Date()): FoodDayRecord {
  const key = localDateKey(date);
  const history = loadFoodHistory();
  const current = history.find((item) => item.date === key) ?? { date: key, entries: [] };
  const updated: FoodDayRecord = {
    ...current,
    entries: [...current.entries.filter((item) => item.id !== entry.id), entry]
      .sort((a, b) => a.at.localeCompare(b.at)),
  };
  const next = [updated, ...history.filter((item) => item.date !== key)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);
  sqliteStateStore.write(FOOD_HISTORY_KEY, next);
  return updated;
}

export function updateFoodEntryTime(entryId: string, time: string, dateKey: string): FoodDayRecord {
  const history = loadFoodHistory();
  const current = history.find((item) => item.date === dateKey) ?? { date: dateKey, entries: [] };
  const entries = correctFoodEntryTime(current.entries, entryId, time, dateKey);
  if (!entries) return current;

  const updated: FoodDayRecord = {
    ...current,
    entries,
  };
  const next = [updated, ...history.filter((item) => item.date !== dateKey)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);
  sqliteStateStore.write(FOOD_HISTORY_KEY, next);
  return updated;
}

export function removeFoodEntry(entryId: string, date = new Date()): FoodDayRecord {
  const key = localDateKey(date);
  const history = loadFoodHistory();
  const current = history.find((item) => item.date === key) ?? { date: key, entries: [] };
  const updated: FoodDayRecord = {
    ...current,
    entries: current.entries.filter((item) => item.id !== entryId),
  };
  sqliteStateStore.write(
    FOOD_HISTORY_KEY,
    [updated, ...history.filter((item) => item.date !== key)].slice(0, 14),
  );
  return updated;
}

export function shiftContextForDate(week: PersistedWeekState, date = new Date()): ShiftContext {
  return shiftContextForDateDomain(week, date);
}

export function shiftForDate(week: PersistedWeekState, date = new Date()): Shift {
  return shiftForDateDomain(week, date);
}

export function nextWorkingShift(week: PersistedWeekState, fromDate = new Date()): UpcomingShift | null {
  return nextWorkingShiftDomain(week, fromDate);
}

export function clearActualExit() {
  const state = loadDayState();
  saveDayState({
    ...state,
    actualExit: null,
    actualExitAt: null,
    actualExitShiftKey: null,
    actualExitReplanConfirmed: false,
  });
}
