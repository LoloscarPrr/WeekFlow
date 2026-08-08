import * as SQLite from 'expo-sqlite';
import type { BrainSnapshot, Energy, Shift, ShiftType } from '@/src/brain/types';

const db = SQLite.openDatabaseSync('weekflow.db');
const DAY_STATE_KEY = 'day-live-state';
const WEEK_STATE_KEY = 'week-state';

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

export function loadDayState(): PersistedDayState {
  const parsed = readState<any>(DAY_STATE_KEY);
  if (!parsed) return defaultDayState;

  // v4.8.2 stored the timing fields inside `snapshot`.
  // Migrate them once without keeping a second source of truth for the shift.
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

export function shiftForDate(week: PersistedWeekState, date = new Date()): Shift {
  const mondayBasedDay = (date.getDay() + 6) % 7;
  const stored = week.shifts.find((item) => item.day === mondayBasedDay);
  if (!stored) return { start: '', end: '', type: 'off' };
  return { start: stored.start, end: stored.end, type: stored.type };
}

export function clearActualExit() {
  const state = loadDayState();
  saveDayState({ ...state, actualExit: null, actualExitAt: null });
}
