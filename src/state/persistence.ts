import * as SQLite from 'expo-sqlite';
import type { BrainSnapshot, Energy } from '@/src/brain/types';

const db = SQLite.openDatabaseSync('weekflow.db');
const STATE_KEY = 'day-live-state';

export type PersistedDayState = {
  energy: Energy;
  snapshot: Omit<BrainSnapshot, 'energy'>;
  actualExit: string | null;
  actualExitAt: string | null;
};

export const defaultDayState: PersistedDayState = {
  energy: 'bien',
  snapshot: {
    shift: { start: '12:30', end: '21:30', type: 'afternoon' },
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

function ensureTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS weekflow_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function loadDayState(): PersistedDayState {
  ensureTable();

  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM weekflow_state WHERE key = ? LIMIT 1;',
    STATE_KEY,
  );

  if (!row?.value) return defaultDayState;

  try {
    const parsed = JSON.parse(row.value) as Partial<PersistedDayState>;
    return {
      ...defaultDayState,
      ...parsed,
      snapshot: {
        ...defaultDayState.snapshot,
        ...(parsed.snapshot ?? {}),
        shift: {
          ...defaultDayState.snapshot.shift,
          ...(parsed.snapshot?.shift ?? {}),
        },
      },
    };
  } catch {
    return defaultDayState;
  }
}

export function saveDayState(state: PersistedDayState) {
  ensureTable();

  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO weekflow_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    STATE_KEY,
    JSON.stringify(state),
    now,
  );
}

export function clearActualExit() {
  const state = loadDayState();
  saveDayState({ ...state, actualExit: null, actualExitAt: null });
}
