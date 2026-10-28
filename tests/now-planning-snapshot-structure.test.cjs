const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const controller = read('src/presentation/now/useNowController.ts');
const view = read('src/application/useCases/getNowView.ts');
const moments = read('src/brain/confirmedPlanMoments.ts');
assert.ok(controller.includes('useState(loadNowPlanningState)'), 'initial canonical planning snapshot at mount');
const refresh = controller.slice(controller.indexOf('const refreshNow ='), controller.indexOf('useFocusEffect('));
assert.ok(refresh.includes('setPlanningState(loadNowPlanningState())'), 'focus and pull-to-refresh reload canonical snapshot');
assert.ok(controller.includes('useFocusEffect(') && controller.includes('refreshNow();'), 'screen-focus refresh retained');
assert.ok(controller.includes('setInterval(() => setClockNow(new Date()), 30_000)'), '30-second live clock retains dynamic plan updates');
assert.ok(controller.includes('moveDoneFromHistoryOnDate(planningState.moveHistory, clockNow)'), 'Move done-today derives from cached history using current local date');
assert.ok(controller.includes('planningState,') && controller.includes('[clockNow, dayState, planningState, weekState]'), 'time-based view recalculation uses snapshot');
assert.doesNotMatch(controller, /moveSessionDoneToday\(/, 'Now does not duplicate Move history SQLite read');
const getBody = view.slice(view.indexOf('export function getNowView('));
assert.ok(getBody.includes('planningState ?? loadNowPlanningState()'), 'existing no-snapshot callers retain live canonical reads');
assert.ok(getBody.includes('const confirmedWeek = planning.confirmedWeek'), 'plan comes from selected snapshot');
assert.ok(getBody.includes('confirmedMomentsForNow(confirmedWeek, planning.habits, now, planning.moveHistory)'), 'dynamic event selection uses provided habits and Move history');
for (const readMethod of ['loadConfirmedWeeklyPlan(', 'loadHabitsState(', 'loadMoveHistory(']) {
  assert.ok(!getBody.includes(readMethod), 'clock tick must not directly read SQLite: ' + readMethod);
}
const loader = view.slice(view.indexOf('export function loadNowPlanningState('), view.indexOf('export type GetNowViewInput = '));
for (const readMethod of ['confirmedWeek: loadConfirmedWeeklyPlan()', 'habits: loadHabitsState()', 'moveHistory: loadMoveHistory()']) {
  assert.ok(loader.includes(readMethod), 'canonical loader must use '+readMethod);
}
for (const marker of ['const regularContext = shiftContextForDate(', 'const phase = phaseForShift(', 'const workProgress = phase ===', 'const confirmedForNow = confirmedMomentsForNow(', 'at.getTime() >= now.getTime()', 'const inPostNightRecovery = Boolean(']) {
  assert.ok(getBody.includes(marker), 'time/overnight re-evaluation retained: '+marker);
}
assert.ok(moments.includes('if (localHabitDateKey(monday) !== plan.weekStart) return []'), 'expired weekly plans remain hidden by time');
console.log('Now planning snapshot, no-SQLite clock tick and overnight structure checks passed.');
