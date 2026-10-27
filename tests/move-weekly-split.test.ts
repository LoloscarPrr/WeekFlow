import { moveWeeklySplit } from '../src/move/weeklySplit';
import { proposeWeeklyPlan } from '../src/brain/weeklyPlanner';
import { DEFAULT_MOVE_PREFERENCES, sanitizeMovePreferences } from '../src/move/adaptation';
import { compatibleTargetedExercises, routineForDuration } from '../src/move/library';
import { MOVE_MUSCLE_EXERCISE_IDS, type MoveMuscleGroup } from '../src/move/muscles';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';

function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error(label + ': ' + JSON.stringify(actual));
}
function ok(value: unknown, message: string) { if (!value) throw Error(message); }
const prefs = DEFAULT_MOVE_PREFERENCES;
eq(moveWeeklySplit(prefs, 1), [[]], '1 sesión es cuerpo completo');
eq(moveWeeklySplit(prefs, 2), [['pecho','espalda','hombros','biceps','triceps'],['piernas','gluteos','core']], '2 sesiones: superior/inferior');
eq(moveWeeklySplit(prefs, 3), [['pecho','hombros','triceps'],['piernas','gluteos','core'],['espalda','biceps']], '3 sesiones: empuje/pierna/tirón');
eq(moveWeeklySplit(prefs, 4).length, 4, '4 sesiones requieren cuatro sesiones');
eq(moveWeeklySplit(prefs, 0), [], 'sin plan semanal');
eq(moveWeeklySplit({...prefs, goal:'movilidad'}, 3), [[],[],[]], 'movilidad no crea split artificial de fuerza');
eq(moveWeeklySplit({...prefs, goal:'condicion'}, 2), [[],[]], 'cardio es cuerpo completo');
eq(moveWeeklySplit({...prefs, targetMuscles:['espalda','biceps']}, 3),
  [['espalda','biceps'],['espalda','biceps'],['espalda','biceps']], 'objetivo exclusivo no añade grupos');
eq(moveWeeklySplit({...prefs, targetMuscles:['pecho','piernas','espalda']}, 3),
  [['pecho'],['piernas'],['espalda']], 'agrupa por sesión sin agregar músculos distintos');
eq(moveWeeklySplit({...prefs, targetMuscles:['pecho','piernas','espalda']}, 5),
  [['pecho'],['piernas'],['espalda'],['pecho'],['piernas']], 'rotación consistente');
const monday = new Date(2026, 9, 26, 8, 0);
const input = {
  now: monday, week: defaultWeekState,
  habits: { habits: [], completions: [] },
  settings: defaultDayState.settings, energy: 'bien' as const, weekOffset: 0 as const,
  move: { preferences: prefs, history: [] },
};
const base = proposeWeeklyPlan(input);
eq(base.moveSlots.length, 3, 'tres entrenamientos por pilar Move');
eq(base.moveSlots.map(s=>s.targetMuscles),
   moveWeeklySplit(prefs, 3), 'plan semanal asigna split real a cada día');
for (const slot of base.moveSlots) {
  ok(slot.sampleExercises.length>0, 'preview tiene ejercicios');
  const split = slot.targetMuscles as MoveMuscleGroup[];
  const eligibility = compatibleTargetedExercises({...prefs,targetMuscles:split}, slot.intensity);
  ok(eligibility.length>0, 'split tiene ejercicios compatibles');
  const eligibleIds = new Set(split.flatMap(g => MOVE_MUSCLE_EXERCISE_IDS[g]));
  const routine = routineForDuration(slot.durationMin, {...prefs,targetMuscles:split},slot.intensity);
  ok(routine.steps.every(step => {
    const exercises = step.mode === 'amrap' ? (step.circuit ?? []).map(x=>x.exercise) : [step.exercise];
    return exercises.every(ex=>eligibleIds.has(ex.id));
  }), 'la rutina no mezcla músculos ajenos al día');
}
const originalPrefs = JSON.stringify(prefs);
eq(JSON.stringify(prefs), originalPrefs, 'preview conserva perfil original');
const completed = proposeWeeklyPlan({...input,move:{preferences:prefs,history:[
  {finishedAt:'2026-10-26T16:00:00',feedback:'Bien',endedEarly:false}
]}});
eq(completed.moveSlots.length, 2, 'entrenamiento completado disminuye pendientes');
eq(completed.moveSlots[0]?.targetMuscles, ['piernas','gluteos','core'], 'replanificar no reinicia división en empuje');
eq(completed.moveSlots[1]?.targetMuscles, ['espalda','biceps'], 'segunda pendiente sigue como tirón');
const custom = sanitizeMovePreferences({goal:'fuerza',weeklyTargetSessions:3,targetMuscles:['espalda','biceps']});
const onlyBack = proposeWeeklyPlan({...input,move:{preferences:custom,history:[]}});
ok(onlyBack.moveSlots.every(slot=>slot.targetMuscles?.join(',')==='espalda,biceps'),
  'objetivo individual no introduce músculos no solicitados');
const blocked = sanitizeMovePreferences({targetMuscles:['biceps'], avoidAreas:['wrists']});
const unsafe = proposeWeeklyPlan({...input,move:{preferences:blocked,history:[]}});
eq(unsafe.moveSlots.length,0, 'sin equipo compatible no propone entrenamiento');
ok(unsafe.warnings.some(w=>w.includes('Move:')), 'explica por qué faltan sesiones');
console.log('Weekly Move split tests passed.');
