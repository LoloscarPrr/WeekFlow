import { nextConfirmedMoveSlot } from '../src/move/confirmedPlanSelection';
import type { WeeklyMoveSlot } from '../src/brain/weeklyPlanner';

function equal(actual: unknown, expected: unknown, label: string) {
  if (!Object.is(actual, expected)) throw Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}
const slot = (id: string, date: string): WeeklyMoveSlot => ({
  id, date, start: '10:00', end: '10:30', durationMin: 30,
  intensity: 'moderada', muscles: 'Cuerpo completo', sampleExercises: ['Sentadilla'], explanation: 'Plan confirmado',
});
const yesterday = slot('yesterday', '2026-10-27');
const today = slot('today', '2026-10-28');
const tomorrow = slot('tomorrow', '2026-10-29');
const unchanged = [yesterday, today, tomorrow];
equal(nextConfirmedMoveSlot(unchanged, '2026-10-28', false), today, 'session scheduled today remains actionable');
equal(nextConfirmedMoveSlot(unchanged, '2026-10-28', true), tomorrow, 'completed today excludes next pending today slot');
equal(nextConfirmedMoveSlot([yesterday], '2026-10-28', false), undefined, 'past dates ignored');
equal(nextConfirmedMoveSlot([], '2026-10-28', false), undefined, 'missing confirmed plan safe');
equal(nextConfirmedMoveSlot([tomorrow, today], '2026-10-28', false), tomorrow, 'saved ordering preserved');
equal(nextConfirmedMoveSlot([tomorrow, today], '2026-10-28', true), tomorrow, 'future session remains visible');
equal(nextConfirmedMoveSlot([today], '2026-10-28', true), undefined, 'no next session if completed today');
equal(unchanged.length, 3, 'input not mutated');
console.log('Move confirmed plan selection regression tests passed.');
