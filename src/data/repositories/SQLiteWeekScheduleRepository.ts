import type { WeekSchedule } from '@/src/domain/entities/Shift';
import type { WeekScheduleRepository } from '@/src/domain/repositories/WeekScheduleRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { migrateWeekSchedule } from '@/src/data/migrations/stateMigrations';

const WEEK_STATE_KEY = 'week-state';

export class SQLiteWeekScheduleRepository implements WeekScheduleRepository {
  load(): WeekSchedule {
    return migrateWeekSchedule(sqliteStateStore.read<unknown>(WEEK_STATE_KEY));
  }

  save(state: WeekSchedule) {
    sqliteStateStore.write(WEEK_STATE_KEY, state);
  }
}

export const sqliteWeekScheduleRepository = new SQLiteWeekScheduleRepository();
