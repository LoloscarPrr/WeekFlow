import * as SQLite from 'expo-sqlite';
import type { BrainSnapshot, Energy, Shift, ShiftType } from '@/src/brain/types';

const db = SQLite.openDatabaseSync('weekflow.db');
const DAY_STATE_KEY = 'day-live-state';
const WEEK_STATE_KEY = 'week-state';
const USER_PROFILE_KEY = 'user-profile';
const MOVE_HISTORY_KEY = 'move-history';
const MOVE_ACTIVE_KEY = 'move-active-session';
const FOOD_HISTORY_KEY = 'food-history';

export type DaySettings = Omit<BrainSnapshot, 'energy' | 'shift'>;

export type PersistedDayState = {
  energy: Energy;
  settings: DaySettings;
  actualExit: string | null;
  actualExitAt: string | null;
};

export type PersistedWeekShift = Shift & {
  day: number;
};

export type PersistedWeekState = {
  shifts: PersistedWeekShift[];
};

export type ShiftContext = {
  shift: Shift;
  day: number;
  startAt: string | null;
  endAt: string | null;
  overnightCarry: boolean;
  key: string;
};

export type UpcomingShift = {
  shift: Shift;
  day: number;
  startAt: string;
  endAt: string;
  key: string;
};

export type UserProfile = {
  scheduleName: string;
};

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

export type FoodEntry = {
  id: string;
  at: string;
  title: string;
  kind: 'meal' | 'snack' | 'drink' | 'other';
  source: 'suggestion' | 'manual';
};

export type FoodDayRecord = {
  date: string;
  entries: FoodEntry[];
};

export const defaultDayState: PersistedDayState = {
  energy: 'bien',
  settings: {
    commuteOutMin: 75,
    commuteBackMin: 75,
    prepMin: 35,
    bufferMin: 15,
    mealMin: 25,
    recoveryMin: 30,
  },
  actualExit: null,
  actualExitAt: null,
};

export const defaultWeekState: PersistedWeekState = {
  shifts: Array.from({ length: 7 }, (_, day) => ({
    day,
    start: '',
    end: '',
    type: 'off' as ShiftType,
  })),
};

export const defaultUserProfile: UserProfile = {
  scheduleName: '',
};

function ensureTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS weekflow_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function readState<T>(key: string): T | null {
  ensureTable();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM weekflow_state WHERE key = ? LIMIT 1;',
    key,
  );
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

function writeState(key: string, value: unknown) {
  ensureTable();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO weekflow_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    key,
    JSON.stringify(value),
    now,
  );
}

function deleteState(key: string) {
  ensureTable();
  db.runSync('DELETE FROM weekflow_state WHERE key = ?;', key);
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function crossesMidnight(shift: Shift) {
  return shift.type !== 'off' && Boolean(shift.start) && Boolean(shift.end) && toMinutes(shift.end) <= toMinutes(shift.start);
}

function storedShiftForDate(week: PersistedWeekState, date: Date): PersistedWeekShift {
  const day = mondayBasedDay(date);
  return week.shifts.find((item) => item.day === day) ?? defaultWeekState.shifts[day];
}

function dateAtTime(date: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function shiftWindowForDate(week: PersistedWeekState, date: Date) {
  const stored = storedShiftForDate(week, date);
  const shift: Shift = { start: stored.start, end: stored.end, type: stored.type };
  if (shift.type === 'off' || !shift.start || !shift.end) {
    return { shift, day: stored.day, startAt: null as Date | null, endAt: null as Date | null };
  }

  const startAt = dateAtTime(date, shift.start);
  const endAt = dateAtTime(date, shift.end);
  if (crossesMidnight(shift)) endAt.setDate(endAt.getDate() + 1);
  return { shift, day: stored.day, startAt, endAt };
}

export function loadDayState(): PersistedDayState {
  const parsed = readState<any>(DAY_STATE_KEY);
  if (!parsed) return defaultDayState;

  const legacySnapshot = parsed.snapshot ?? {};

  return {
    energy: parsed.energy ?? defaultDayState.energy,
    settings: {
      ...defaultDayState.settings,
      ...(parsed.settings ?? {}),
      commuteOutMin: parsed.settings?.commuteOutMin ?? legacySnapshot.commuteOutMin ?? defaultDayState.settings.commuteOutMin,
      commuteBackMin: parsed.settings?.commuteBackMin ?? legacySnapshot.commuteBackMin ?? defaultDayState.settings.commuteBackMin,
      prepMin: parsed.settings?.prepMin ?? legacySnapshot.prepMin ?? defaultDayState.settings.prepMin,
      bufferMin: parsed.settings?.bufferMin ?? legacySnapshot.bufferMin ?? defaultDayState.settings.bufferMin,
      mealMin: parsed.settings?.mealMin ?? legacySnapshot.mealMin ?? defaultDayState.settings.mealMin,
      recoveryMin: parsed.settings?.recoveryMin ?? legacySnapshot.recoveryMin ?? defaultDayState.settings.recoveryMin,
    },
    actualExit: parsed.actualExit ?? null,
    actualExitAt: parsed.actualExitAt ?? null,
  };
}

export function saveDayState(state: PersistedDayState) {
  writeState(DAY_STATE_KEY, state);
}

export function loadWeekState(): PersistedWeekState {
  const parsed = readState<Partial<PersistedWeekState>>(WEEK_STATE_KEY);
  if (!parsed?.shifts || !Array.isArray(parsed.shifts)) return defaultWeekState;

  const shifts = defaultWeekState.shifts.map((fallback) => {
    const incoming = parsed.shifts?.find((item) => item.day === fallback.day);
    if (!incoming) return fallback;
    return {
      ...fallback,
      ...incoming,
      day: fallback.day,
    };
  });

  return { shifts };
}

export function saveWeekState(state: PersistedWeekState) {
  writeState(WEEK_STATE_KEY, state);
}

export function loadUserProfile(): UserProfile {
  const parsed = readState<Partial<UserProfile>>(USER_PROFILE_KEY);
  return {
    scheduleName: typeof parsed?.scheduleName === 'string' ? parsed.scheduleName : '',
  };
}

export function saveUserProfile(profile: UserProfile) {
  writeState(USER_PROFILE_KEY, profile);
}

export function loadMoveHistory(): MoveSessionRecord[] {
  const parsed = readState<MoveSessionRecord[]>(MOVE_HISTORY_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveMoveSession(record: MoveSessionRecord) {
  const history = loadMoveHistory().filter((item) => item.id !== record.id);
  writeState(MOVE_HISTORY_KEY, [record, ...history].slice(0, 30));
}

export function loadActiveMoveSession(): ActiveMoveSession | null {
  const parsed = readState<Partial<ActiveMoveSession>>(MOVE_ACTIVE_KEY);
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
  writeState(MOVE_ACTIVE_KEY, session);
}

export function clearActiveMoveSession() {
  deleteState(MOVE_ACTIVE_KEY);
}

export function moveSessionDoneToday(date = new Date()) {
  const key = localDateKey(date);
  return loadMoveHistory().some((item) => localDateKey(new Date(item.finishedAt)) === key);
}

export function loadFoodHistory(): FoodDayRecord[] {
  const parsed = readState<FoodDayRecord[]>(FOOD_HISTORY_KEY);
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
    entries: [...current.entries.filter((item) => item.id !== entry.id), entry].sort((a, b) => a.at.localeCompare(b.at)),
  };
  const next = [updated, ...history.filter((item) => item.date !== key)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);
  writeState(FOOD_HISTORY_KEY, next);
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
  writeState(FOOD_HISTORY_KEY, [updated, ...history.filter((item) => item.date !== key)].slice(0, 14));
  return updated;
}

export function shiftContextForDate(week: PersistedWeekState, date = new Date()): ShiftContext {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  const previous = shiftWindowForDate(week, previousDate);

  if (previous.startAt && previous.endAt && crossesMidnight(previous.shift) && date >= previous.startAt && date < previous.endAt) {
    return {
      shift: previous.shift,
      day: previous.day,
      startAt: previous.startAt.toISOString(),
      endAt: previous.endAt.toISOString(),
      overnightCarry: true,
      key: `${localDateKey(previous.startAt)}@${previous.shift.start}`,
    };
  }

  const current = shiftWindowForDate(week, date);
  return {
    shift: current.shift,
    day: current.day,
    startAt: current.startAt?.toISOString() ?? null,
    endAt: current.endAt?.toISOString() ?? null,
    overnightCarry: false,
    key: current.startAt ? `${localDateKey(current.startAt)}@${current.shift.start}` : `${localDateKey(date)}@off`,
  };
}

export function shiftForDate(week: PersistedWeekState, date = new Date()): Shift {
  return shiftContextForDate(week, date).shift;
}

export function nextWorkingShift(week: PersistedWeekState, fromDate = new Date()): UpcomingShift | null {
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(fromDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const window = shiftWindowForDate(week, date);
    if (!window.startAt || !window.endAt || window.shift.type === 'off') continue;
    if (window.startAt.getTime() <= fromDate.getTime()) continue;

    return {
      shift: window.shift,
      day: window.day,
      startAt: window.startAt.toISOString(),
      endAt: window.endAt.toISOString(),
      key: `${localDateKey(window.startAt)}@${window.shift.start}`,
    };
  }
  return null;
}

export function clearActualExit() {
  const state = loadDayState();
  saveDayState({ ...state, actualExit: null, actualExitAt: null });
}
