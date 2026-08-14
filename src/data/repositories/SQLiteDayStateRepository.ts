import { defaultDayState } from '@/src/domain/defaults';
import type { DayState } from '@/src/domain/entities/DailyState';
import type { DayStateRepository } from '@/src/domain/repositories/DayStateRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';

const DAY_STATE_KEY = 'day-live-state';

export class SQLiteDayStateRepository implements DayStateRepository {
  load(): DayState {
    const parsed = sqliteStateStore.read<any>(DAY_STATE_KEY);
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
      actualExitShiftKey: typeof parsed.actualExitShiftKey === 'string' ? parsed.actualExitShiftKey : null,
      actualExitReplanConfirmed: Boolean(parsed.actualExitReplanConfirmed),
    };
  }

  save(state: DayState) {
    sqliteStateStore.write(DAY_STATE_KEY, state);
  }
}

export const sqliteDayStateRepository = new SQLiteDayStateRepository();
