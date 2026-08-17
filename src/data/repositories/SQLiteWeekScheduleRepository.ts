import type { WeekSchedule } from '@/src/domain/entities/Shift';
import type { WeekScheduleRepository } from '@/src/domain/repositories/WeekScheduleRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { migrateWeekSchedule } from '@/src/data/migrations/stateMigrations';

const WEEK_STATE_KEY = 'week-state';

export class SQLiteWeekScheduleRepository implements WeekScheduleRepository {
  load(): WeekSchedule {
    const stored = sqliteStateStore.read<unknown>(WEEK_STATE_KEY);
    const migrated = migrateWeekSchedule(stored);

    if (stored !== null && JSON.stringify(stored) !== JSON.stringify(migrated)) {
      sqliteStateStore.write(WEEK_STATE_KEY, migrated);
    }

    return migrated;
  }

  save(state: WeekSchedule) {
    sqliteStateStore.write(WEEK_STATE_KEY, state);
  }
}

export const sqliteWeekScheduleRepository = new SQLiteWeekScheduleRepository();
