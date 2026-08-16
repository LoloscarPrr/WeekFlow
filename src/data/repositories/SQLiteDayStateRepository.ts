import type { DayState } from '@/src/domain/entities/DailyState';
import type { DayStateRepository } from '@/src/domain/repositories/DayStateRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { migrateDayState } from '@/src/data/migrations/stateMigrations';

const DAY_STATE_KEY = 'day-live-state';

export class SQLiteDayStateRepository implements DayStateRepository {
  load(): DayState {
    return migrateDayState(sqliteStateStore.read<unknown>(DAY_STATE_KEY));
  }

  save(state: DayState) {
    sqliteStateStore.write(DAY_STATE_KEY, state);
  }
}

export const sqliteDayStateRepository = new SQLiteDayStateRepository();
