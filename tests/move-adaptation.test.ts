import { recommendMoveMinutes, sanitizeMovePreferences, type MovePreferences } from '../src/move/adaptation';
import { alternateExercise, previewForDuration, routineForDuration } from '../src/move/library';
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
equal(recommendMoveMinutes('bien', null, offShift, true), 10, 'terminar antes reduce la siguiente propuesta sin castigo');

const standing: MovePreferences = { focus: 'fuerza', floorAllowed: false, chairAvailable: false, avoidAreas: [] };
const standingRoutine = routineForDuration(10, standing);
equal(standingRoutine.totalSeconds, 600, 'rutina de pie dura 10 minutos');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'floor'), 'sin ejercicios de suelo cuando están desactivados');
ok(standingRoutine.steps.every((step) => step.exercise.needs !== 'chair'), 'sin silla cuando no está disponible');

const strengthPreview = previewForDuration(10, standing);
ok(strengthPreview.some((exercise) => ['squat', 'wall-sit', 'hip-hinge', 'wall-press'].includes(exercise.id)), 'preview de fuerza contiene fuerza general real');
ok(!['shoulders', 'reach'].includes(strengthPreview[0]?.id ?? ''), 'fuerza no empieza con movilidad pura');

const floorStrength: MovePreferences = { focus: 'fuerza', floorAllowed: true, chairAvailable: true, avoidAreas: [] };
const floorRoutine = routineForDuration(20, floorStrength);
equal(floorRoutine.totalSeconds, 1200, 'rutina fuerza dura 20 minutos');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'floor'), 'fuerza puede usar suelo si está permitido');
ok(floorRoutine.steps.some((step) => step.exercise.needs === 'chair'), 'fuerza puede usar silla si está disponible');

const activation: MovePreferences = { focus: 'activar', floorAllowed: false, chairAvailable: false, avoidAreas: [] };
const activationPreview = previewForDuration(10, activation);
ok(activationPreview.some((exercise) => ['march', 'side-step', 'squat-reach', 'knee-lift', 'reverse-lunge'].includes(exercise.id)), 'activar usa movimiento dinámico');

const mobility: MovePreferences = { focus: 'movilidad', floorAllowed: false, chairAvailable: false, avoidAreas: [] };
const mobilityRoutine = routineForDuration(5, mobility);
equal(mobilityRoutine.totalSeconds, 300, 'movilidad dura 5 minutos');
equal(mobilityRoutine.steps.at(-1)?.exercise.id, 'breathing', 'movilidad cierra con respiración');
const mobilityPreview = previewForDuration(10, mobility);
ok(mobilityPreview.some((exercise) => ['shoulders', 'reach', 'calf-release'].includes(exercise.id)), 'movilidad conserva movimientos suaves');
ok(activationPreview.map((item) => item.id).join(',') !== mobilityPreview.map((item) => item.id).join(','), 'activar y movilidad producen previews distintas');

const avoidKnees: MovePreferences = { focus: 'activar', floorAllowed: false, chairAvailable: true, avoidAreas: ['knees'] };
const kneesRoutine = routineForDuration(10, avoidKnees);
ok(kneesRoutine.steps.every((step) => !step.exercise.areas.includes('knees')), 'rodillas evitadas no aparecen en la rutina');
equal(kneesRoutine.totalSeconds, 600, 'filtrar rodillas mantiene la duración objetivo');

const avoidUpper: MovePreferences = { focus: 'fuerza', floorAllowed: true, chairAvailable: true, avoidAreas: ['shoulders', 'wrists'] };
const upperRoutine = routineForDuration(20, avoidUpper);
ok(upperRoutine.steps.every((step) => !step.exercise.areas.includes('shoulders')), 'hombros evitados no aparecen en la rutina');
ok(upperRoutine.steps.every((step) => !step.exercise.areas.includes('wrists')), 'muñecas evitadas no aparecen en la rutina');
const swapped = alternateExercise({
  id: 'test', icon: '•', title: 'Test', cue: '', easier: '', swapWith: 'incline-push', needs: 'none', focus: ['fuerza'], areas: [],
}, avoidUpper);
ok(!swapped.areas.includes('shoulders') && !swapped.areas.includes('wrists'), 'cambiar ejercicio respeta zonas evitadas');

const allAvoided: MovePreferences = { focus: 'equilibrado', floorAllowed: true, chairAvailable: true, avoidAreas: ['shoulders', 'knees', 'wrists', 'lowerBack'] };
const constrainedRoutine = routineForDuration(5, allAvoided);
ok(constrainedRoutine.steps.every((step) => step.exercise.areas.every((area) => !allAvoided.avoidAreas.includes(area))), 'fallback nunca reintroduce una zona bloqueada');
equal(constrainedRoutine.steps.at(-1)?.exercise.id, 'breathing', 'cierre respiratorio sigue disponible con todas las zonas marcadas');

const legacy = sanitizeMovePreferences({ focus: 'movilidad', floorAllowed: true, chairAvailable: false });
equal(legacy.avoidAreas.length, 0, 'preferencias antiguas cargan sin zonas evitadas');
const sanitized = sanitizeMovePreferences({ focus: 'fuerza', floorAllowed: true, chairAvailable: true, avoidAreas: ['knees', 'knees', 'unknown'] });
equal(sanitized.avoidAreas.length, 1, 'sanitización deduplica e ignora zonas desconocidas');
equal(sanitized.avoidAreas[0], 'knees', 'sanitización conserva una zona válida');

console.log('Move adaptation regression tests passed.');
