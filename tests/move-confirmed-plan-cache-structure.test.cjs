const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (filename) => fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
const plan = read('src/move/MovePlan.tsx');
const controller = read('src/move/useMoveController.ts');
const viewBlock = plan.slice(plan.indexOf('export function MovePlan('));
assert.ok(viewBlock.includes('nextConfirmedMoveSlot(confirmedMoveSlots, todayKey, doneToday)'), 'MovePlan uses cached confirmed slots');
assert.ok(!plan.includes('loadConfirmedWeeklyPlan'), 'no sync SQLite read in MovePlan render');
assert.match(controller, /useState<WeeklyMoveSlot\[\]>\(readConfirmedMoveSlots\)/, 'initial snapshot loaded only on mount');
const refresh = controller.slice(controller.indexOf('const refreshMove = '), controller.indexOf('useFocusEffect('));
assert.ok(refresh.includes('setConfirmedMoveSlots(currentSlots)'), 'focus refresh reloads confirmed plan');
assert.ok(refresh.includes('setPreparedWeekly((selected)'), 'stale prepared selection updated on focus');
const prepare = controller.slice(controller.indexOf('function prepareWeeklySession('), controller.indexOf('function prepareWeeklySessionById('));
assert.ok(prepare.includes('const currentSlots = readConfirmedMoveSlots()'), 'tap validates fresh SQLite state');
assert.ok(prepare.includes('setConfirmedMoveSlots(currentSlots)'), 'tap refreshes displayed snapshot');
for (const part of ['item.id === slot.id', 'item.date === slot.date', 'item.start === slot.start', 'item.durationMin === slot.durationMin']) {
  assert.ok(prepare.includes(part), 'tap-time identity check preserved: ' + part);
}
assert.ok(prepare.includes('setPreparedWeekly(null)'), 'stale confirmation rejected and discarded');
assert.ok(prepare.includes('setPreparedWeekly(saved)'), 'fresh canonical slot is selected');
const byId = controller.slice(controller.indexOf('function prepareWeeklySessionById('), controller.indexOf('function setWeeklyTargetSessions('));
assert.ok(byId.includes('loadConfirmedWeeklyPlan()'), 'deep link always reads canonical plan');
assert.ok(byId.includes('prepareWeeklySession(slot)'), 'deep link still revalidates the selected slot');
assert.ok(!byId.includes('startSession('), 'deep link never starts playback itself');
assert.ok(viewBlock.includes('preparedWeekly ?? nextConfirmedMoveSlot'), 'explicit deep link slot keeps precedence');
console.log('Move confirmed-plan cache and freshness structure tests passed.');
