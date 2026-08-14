import { defaultWeekState } from '@/src/domain/defaults';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import type { WeekScheduleRepository } from '@/src/domain/repositories/WeekScheduleRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';

const WEEK_STATE_KEY = 'week-state';

export class SQLiteWeekScheduleRepository implements WeekScheduleRepository {
  load(): WeekSchedule {
    const parsed = sqliteStateStore.read<Partial<WeekSchedule>>(WEEK_STATE_KEY);
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

  save(state: WeekSchedule) {
    sqliteStateStore.write(WEEK_STATE_KEY, state);
  }
}

export const sqliteWeekScheduleRepository = new SQLiteWeekScheduleRepository();
