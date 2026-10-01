import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { EMPTY_HABITS_STATE, sanitizeHabitsState, type HabitsState } from '@/src/habits/core';

const HABITS_STATE_KEY = 'habits-state';

export function loadHabitsState(): HabitsState {
  const persisted = sqliteStateStore.read<unknown>(HABITS_STATE_KEY);
  return persisted ? sanitizeHabitsState(persisted) : EMPTY_HABITS_STATE;
}

export function saveHabitsState(state: HabitsState): HabitsState {
  const sanitized = sanitizeHabitsState(state);
  sqliteStateStore.write(HABITS_STATE_KEY, sanitized);
  return sanitized;
}
