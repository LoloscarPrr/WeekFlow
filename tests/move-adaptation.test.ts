import { recommendMoveMinutes, type MovePreferences } from '../src/move/adaptation';
import { routineForDuration } from '../src/move/library';
import type { Shift } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const workShift: Shift = { start: '07:00', end: '17:30', type: 'morning', breakMinutes: 30 };
const offShift: Shift = { start: '', end: '', type: 'off', breakMinutes: 0 };

equal(recommendMoveMinutes('bien', null, offShift), 20, 'bien en día libre');
equal(recommendMoveMinutes('cansado', null, workShift), 10, 'cansado en jornada');
equal(recommendMoveMinutes('vigoroso', 'Difícil', offShift), 20, 'feedback difícil reduce duración');
equal(recommendMoveMinutes('vigoroso', 'Demasiado', offShift), 10, 'feedback demasiado reduce más');

const standing: MovePreferences = { focus: 'fuerza', floorAllowed: false, chairAvailable: false };
const standingRoutine = routineForDuration(10, standing);
equal(standingRoutine.totalSeconds, 600, 'rutina de pie dura 10 minutos');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'floor'), 'sin ejercicios de suelo cuando están desactivados');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'chair'), 'sin silla cuando no está disponible');

const floorStrength: MovePreferences = { focus: 'fuerza', floorAllowed: true, chairAvailable: true };
const floorRoutine = routineForDuration(20, floorStrength);
equal(floorRoutine.totalSeconds, 1200, 'rutina fuerza dura 20 minutos');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'floor'), 'fuerza puede usar suelo si está permitido');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'chair'), 'fuerza puede usar silla si está disponible');

const mobility: MovePreferences = { focus: 'movilidad', floorAllowed: false, chairAvailable: false };
const mobilityRoutine = routineForDuration(5, mobility);
equal(mobilityRoutine.totalSeconds, 300, 'movilidad dura 5 minutos');
equal(mobilityRoutine.steps.at(-1)?.exercise.id, 'breathing', 'movilidad cierra con respiración');

console.log('Move adaptation regression tests passed.');
