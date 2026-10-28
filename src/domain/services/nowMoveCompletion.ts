import type { MoveSessionRecord } from '@/src/state/persistence';
import { localDateKey } from './shiftSchedule';

/** Check completion using cached history and the local calendar day, not a new SQLite read. */
export function moveDoneFromHistoryOnDate(history: readonly MoveSessionRecord[], at: Date): boolean {
  const day = localDateKey(at);
  return history.some((record) => localDateKey(new Date(record.finishedAt)) === day);
}
