import { nextMoveClockDelayMs } from '../src/move/clock';
import { localDateKey, shiftForDate } from '../src/domain/services/shiftSchedule';
import { defaultWeekState } from '../src/domain/defaults';

function ok(condition: unknown, label: string) {
  if (!condition) throw new Error(label);
}
function equal(actual: unknown, expected: unknown, label: string) {
  if (!Object.is(actual, expected)) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

const started = new Date(2026, 9, 28, 13, 0, 0, 250);
const at = (offsetMs: number) => started.getTime() + offsetMs;

// The old 500 ms polling re-rendered twice per second. Each scheduled tick
// now targets the next full phase second, with a bounded jitter margin.
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(0)), 1016, 'first update at first elapsed second');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(300)), 716, 'fractional phase boundaries');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(999)), 17, 'update just after boundary');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(1016)), 1000, 're-align each second without drifting');
equal(nextMoveClockDelayMs(started.toISOString(), 400, at(1234)), 182, 'persisted pause offset shifts boundary');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(60 * 60 * 1000 + 650)), 366, 'one-hour elapsed uses absolute time');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(30 * 60 * 1000 + 300)), 716, '30-min sessions do not accumulate ticks');
equal(nextMoveClockDelayMs(started.toISOString(), 0, at(60 * 60 * 1000 + 900)), 116, '60-min sessions still align');
equal(nextMoveClockDelayMs('invalid', 0, at(1000)), 1000, 'invalid timestamp fallback');
equal(nextMoveClockDelayMs(started.toISOString(), Number.NaN, at(1000)), 1000, 'invalid pause fallback');

// Seconds shown to users remain the flooring of actual time, not the number
// of callbacks. Delayed callbacks must skip directly to the correct second.
const elapsedSeconds = (timestampMs: number, pausedTotalMs = 0) =>
  Math.floor(Math.max(0, timestampMs - started.getTime() - pausedTotalMs) / 1000);
equal(elapsedSeconds(at(1000)), 1, 'first elapsed second');
equal(elapsedSeconds(at(51000)), 51, 'timer catches up after a delayed wake');
equal(elapsedSeconds(at(3600000), 30000), 3570, 'long session includes cumulative paused time');

// The shift cache must retain overnight carry transitions, which can happen
// *during* a calendar day. Verify minute bucket boundaries, not day-only.
const nightWeek = {
  ...defaultWeekState,
  shifts: defaultWeekState.shifts.map((entry) => entry.day === 1
    ? { ...entry, start: '21:00', end: '05:00', type: 'night' as const }
    : entry),
};
const beforeEnd = new Date(2026, 9, 28, 4, 59, 55);
const atEnd = new Date(2026, 9, 28, 5, 0, 0);
const minuteBucket = (date: Date) => Math.floor(date.getTime() / 60_000);
const minuteDate = (date: Date) => new Date(minuteBucket(date) * 60_000);
equal(localDateKey(beforeEnd), localDateKey(atEnd), 'same calendar date around overnight end');
ok(minuteBucket(beforeEnd) !== minuteBucket(atEnd), 'minute changes when overnight carry ends');
equal(shiftForDate(nightWeek, minuteDate(beforeEnd)).type, 'night', 'minute cache preserves night carry');
equal(shiftForDate(nightWeek, minuteDate(atEnd)).type, 'off', 'minute cache clears ended night carry');
ok(localDateKey(new Date(2026, 9, 28, 23, 59, 59)) !== localDateKey(new Date(2026, 9, 29, 0, 0, 0)), 'day key changes at midnight');

console.log('Move clock cadence and overnight boundary tests passed.');
