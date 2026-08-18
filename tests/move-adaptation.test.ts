import assert from 'node:assert/strict';
import { recommendMoveMinutes, type MovePreferences } from '../src/move/adaptation';
import { routineForDuration } from '../src/move/library';
import type { Shift } from '../src/domain/entities/Shift';

const workShift: Shift = { start: '07:00', end: '17:30', type: 'morning', breakMinutes: 30 };
const offShift: Shift = { start: '', end: '', type: 'off', breakMinutes: 0 };

assert.equal(recommendMoveMinutes('bien', null, offShift), 20);
assert.equal(recommendMoveMinutes('cansado', null, workShift), 10);
assert.equal(recommendMoveMinutes('vigoroso', 'Difícil', offShift), 20);
assert.equal(recommendMoveMinutes('vigoroso', 'Demasiado', offShift), 10);

const standing: MovePreferences = { focus: 'fuerza', floorAllowed: false, chairAvailable: false };
const standingRoutine = routineForDuration(10, standing);
assert.equal(standingRoutine.totalSeconds, 600);
assert.ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'floor'));
assert.ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'chair'));

const floorStrength: MovePreferences = { focus: 'fuerza', floorAllowed: true, chairAvailable: true };
const floorRoutine = routineForDuration(20, floorStrength);
assert.equal(floorRoutine.totalSeconds, 1200);
assert.ok(floorRoutine.steps.some((step) => step.exercise.needs === 'floor'));
assert.ok(floorRoutine.steps.some((step) => step.exercise.needs === 'chair'));

const mobility: MovePreferences = { focus: 'movilidad', floorAllowed: false, chairAvailable: false };
const mobilityRoutine = routineForDuration(5, mobility);
assert.equal(mobilityRoutine.totalSeconds, 300);
assert.equal(mobilityRoutine.steps.at(-1)?.exercise.id, 'breathing');

console.log('Move adaptation regression tests passed.');
