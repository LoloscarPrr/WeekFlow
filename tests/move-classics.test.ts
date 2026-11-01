import { DEFAULT_MOVE_PREFERENCES, type MovePreferences } from '../src/move/adaptation';
import { MOVE_EXERCISE_BY_ID } from '../src/move/exerciseCatalog';
import { compatibleTargetedExercises, previewForDuration, routineForDuration } from '../src/move/library';

const ok = (value: unknown, label: string) => { if (!value) throw Error(label); };
const eq = (actual: unknown, expected: unknown, label: string) => {
  if (!Object.is(actual, expected)) throw Error(label + ': ' + String(actual) + ' instead of ' + String(expected));
};
const profile = (overrides: Partial<MovePreferences>): MovePreferences => ({
  ...DEFAULT_MOVE_PREFERENCES,
  ...overrides,
  equipment: { ...DEFAULT_MOVE_PREFERENCES.equipment, ...overrides.equipment },
});
const regular = profile({
  experience: 'intermedio', focus: 'fuerza', goal: 'fuerza',
  floorAllowed: true, targetMuscles: [],
});
const regularPreview = previewForDuration(30, regular, 'moderada');
ok(regularPreview.some(e => e.id === 'pushup'), 'regular bodyweight strength preview must include standard push-ups');
eq(regularPreview[0]?.family, 'squat', 'classic strength still starts with squat');
ok(!regularPreview.some(e => e.id === 'wall-press'), 'wall press must not dominate regular strength preview');
const normalBalance = profile({ experience:'intermedio', focus:'equilibrado', goal:'bienestar', floorAllowed:true });
ok(previewForDuration(30, normalBalance, 'moderada').some(e => e.id === 'pushup'),
  'balanced normal-day session should include classic push-up with floor availability');
const beginner = profile({ ...regular, experience:'principiante' });
ok(previewForDuration(30, beginner, 'moderada').some(e => e.id === 'knee-pushup'),
  'beginner gets a lower-load push-up variation');
ok(!previewForDuration(30, beginner, 'moderada').some(e => e.id === 'pushup'),
  'beginner is not assigned intermediate standard push-up');
const unknown = profile({ ...regular, experience:'sin_definir' });
ok(previewForDuration(30, unknown, 'moderada').some(e => e.id === 'knee-pushup'),
  'unconfigured experience can still perform recognizable floor basics');
const noFloor = profile({ ...regular, floorAllowed:false });
ok(!previewForDuration(30, noFloor, 'moderada').some(e => ['pushup','knee-pushup','plank'].includes(e.id)),
  'without floor permission no floor exercises');
const recovery = routineForDuration(30, regular, 'recuperacion');
ok(!recovery.steps.some(s => s.exercise.id === 'pushup' || s.exercise.id === 'knee-pushup'),
  'exhausted/recovery intensity never forced into push-ups');
const limited = profile({ ...regular, targetMuscles:['pecho'], avoidAreas:['wrists'] });
ok(!compatibleTargetedExercises(limited,'moderada').some(e => ['pushup','knee-pushup','wall-press'].includes(e.id)),
  'wrist restrictions veto standard and regressed pushups');
const excluded = profile({ ...regular, targetMuscles:['pecho'], excludedExerciseIds:['pushup','knee-pushup'] });
ok(!compatibleTargetedExercises(excluded,'moderada').some(e => ['pushup','knee-pushup'].includes(e.id)),
  'manually excluded pushups never reappear');
const chest = profile({ ...regular, targetMuscles:['pecho'] });
eq(compatibleTargetedExercises(chest,'moderada')[0]?.id, 'pushup',
  'classic pushup takes priority over wall press for eligible chest-only sessions');
ok(previewForDuration(30, chest, 'moderada').some(e=>e.id==='pushup'),
  'targeted preview includes standard pushup');
const equipped = profile({ ...chest, equipment:{...chest.equipment,dumbbellsKg:5} });
const chosen = compatibleTargetedExercises(equipped,'moderada').slice(0,4);
ok(chosen.some(e=>e.id==='pushup'), 'first four chest exercises with dumbbells still include pushups');
ok(chosen[0]?.equipment?.includes('dumbbells'), 'owned dumbbells still lead strength');
ok(chosen[1]?.equipment?.includes('dumbbells'), 'second dumbbell exercise remains available');
ok(previewForDuration(30,equipped,'moderada').some(e=>e.id==='pushup'),
  'set-format preview with registered weights includes classic pushup');
const none = profile({ ...chest, equipment:DEFAULT_MOVE_PREFERENCES.equipment });
ok(compatibleTargetedExercises(none,'moderada').every(e=>!e.equipment?.length),
  'no phantom weighted exercise introduced');
ok(MOVE_EXERCISE_BY_ID.pushup.needs === 'floor', 'push-ups still require floor availability');
console.log('Move classic strength exercise priority tests passed.');
