import { moveDoneFromHistoryOnDate } from '../src/domain/services/nowMoveCompletion';
import type { MoveSessionRecord } from '../src/state/persistence';

function eq(actual: unknown, expected: unknown, label: string) {
  if (!Object.is(actual, expected)) throw Error(label + ': expected '+String(expected)+', got '+String(actual));
}
const record = (id: string, at: Date): MoveSessionRecord => ({
  id, startedAt: at.toISOString(), finishedAt: at.toISOString(),
  plannedMinutes: 30, actualSeconds: 1200, completedSteps: 1, totalSteps: 2,
  endedEarly: false, feedback: null,
});
const at = new Date(2026, 9, 28, 13, 30);
const yesterday = new Date(2026, 9, 27, 21, 30);
const midnight = new Date(2026, 9, 29, 0, 0);
const completed = record('a', at);
const history: MoveSessionRecord[] = [record('old', yesterday), completed];
eq(moveDoneFromHistoryOnDate([], at), false, 'no records yields no completed workout');
eq(moveDoneFromHistoryOnDate([completed], at), true, 'current day workout marked completed');
eq(moveDoneFromHistoryOnDate(history, at), true, 'existing past records do not override today');
eq(moveDoneFromHistoryOnDate(history, midnight), false, 'local midnight resets done-today without refreshing SQLite');
eq(moveDoneFromHistoryOnDate([record('at-midnight', midnight)], midnight), true, 'new local day record recognized');
eq(moveDoneFromHistoryOnDate([record('partial', at)], new Date(2026, 9, 28, 23, 59)), true, 'same-day completion even for stopped workout');
eq(history.length, 2, 'read-only cached history preserved');
console.log('Now Move completion snapshot and local midnight regression tests passed.');
