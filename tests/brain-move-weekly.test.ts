import { proposeWeeklyPlan } from '../src/brain/weeklyPlanner';
import { sanitizeMovePreferences, DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import { upsertHabit } from '../src/habits/core';

function ok(x: unknown, label: string) { if (!x) throw Error(label); }
function eq(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error(label + ' → ' + JSON.stringify(actual));
}
const monday = new Date(2026, 9, 26, 8, 0);
const move = { preferences: DEFAULT_MOVE_PREFERENCES, history: [] };
const input = { now: monday, week: defaultWeekState, habits: { habits: [], completions: [] }, settings: defaultDayState.settings, energy: 'bien' as const, weekOffset: 0 as const, move };
const before = JSON.stringify(input);
const plan = proposeWeeklyPlan(input);
eq(plan.moveSummary, { requested: 3, completed: 0, scheduled: 3 }, 'Move es pilar independiente con tres sesiones por defecto');
eq(plan.slots, [], 'no inventa hábitos para crear entrenamientos');
eq(plan.moveSlots.length, 3, 'genera 3 sesiones sin un hábito Ejercicios');
ok(plan.moveSlots.every(s => s.id.startsWith('move@') && s.durationMin === 30 && s.intensity === 'moderada' && s.sampleExercises.length > 0), 'cada sesión usa el motor de Move');
ok(plan.moveSlots.every(s => s.date >= '2026-10-26' && s.date <= '2026-11-01'), 'sesiones dentro de semana');
const dayIndex = (s: {date:string}) => Number(s.date.slice(-2));
ok(plan.moveSlots.every((s, index, a) => index === 0 || dayIndex(s) - dayIndex(a[index-1]) >= 2), 'hay al menos un día entre sesiones');
eq(JSON.stringify(input), before, 'preview no modifica Week, Move ni Habits');

const old = sanitizeMovePreferences({ goal: 'fuerza', targetMuscles: [] });
eq(old.weeklyTargetSessions, 3, 'perfiles anteriores conservan un objetivo por defecto');
eq(old.preferredSessionMinutes, 30, 'perfil antiguo conserva duración válida');
eq(sanitizeMovePreferences({ weeklyTargetSessions: 900, preferredSessionMinutes: 999 }).weeklyTargetSessions, 3, 'frecuencia insegura no se acepta');
eq(sanitizeMovePreferences({ weeklyTargetSessions: 0 }).weeklyTargetSessions, 0, 'usuario puede desactivar calendario Move');
eq(proposeWeeklyPlan({...input, move: { ...move, preferences: { ...move.preferences, weeklyTargetSessions: 0 } } }).moveSlots.length, 0, 'opción sin plan bloquea solo Move');
eq(proposeWeeklyPlan({...input, move: undefined }).moveSlots.length, 0, 'compatibilidad con llamadas antiguas al motor');
const exhausted = proposeWeeklyPlan({...input, energy: 'agotado' as const});
eq(exhausted.moveSlots.length, 0, 'agotamiento prioriza descanso y muestra faltante');
ok(exhausted.warnings.some(x => x.includes('Move:')), 'no esconde metas incumplidas');

const incompatible = proposeWeeklyPlan({...input, move: {
  ...move, preferences: sanitizeMovePreferences({ targetMuscles: ['biceps'], avoidAreas: ['wrists'] }),
}});
eq(incompatible.moveSlots.length, 0, 'no programa músculos incompatibles con restricciones');
ok(incompatible.warnings.some(x => x.includes('Move:')), 'explica la falta de sesiones');
const long = proposeWeeklyPlan({...input, move: {
  ...move, preferences: sanitizeMovePreferences({ preferredSessionMinutes: 60, weeklyTargetSessions: 2 }),
}});
eq(long.moveSummary, {requested:2,completed:0,scheduled:2}, 'objetivo de dos sesiones independientes');
ok(long.moveSlots.every(s => s.durationMin === 60), 'respeta preferencia de duración en día libre');

let habits = upsertHabit({ habits: [], completions: [] }, { name: 'Ejercicios', targetPerWeek: 3 }, { id: 'legacy', now: monday });
habits = upsertHabit(habits, { name: 'Leer', targetPerWeek: 3 }, { id: 'reading', now: monday });
const legacyBefore = JSON.stringify(habits);
const legacy = proposeWeeklyPlan({...input, habits});
ok(legacy.slots.every(s => s.habitId !== 'legacy'), 'evita doble entrenamiento con hábito antiguo');
ok(legacy.slots.some(s => s.habitId === 'reading'), 'sigue distribuyendo hábitos no deportivos');
ok(legacy.warnings.some(x => x.includes('no se duplicó')), 'avisa tratamiento del hábito heredado');
eq(JSON.stringify(habits), legacyBefore, 'historial y hábito viejo se conservan');
const minutes = (t:string) => Number(t.slice(0,2))*60+Number(t.slice(3));
for(const m of legacy.moveSlots) for(const h of legacy.slots) {
  if(m.date===h.date) ok(minutes(m.end) <= minutes(h.start) || minutes(h.end) <= minutes(m.start), 'Move y Hábitos nunca se solapan');
}

const completed = proposeWeeklyPlan({...input, move: {
  ...move, history:[{ finishedAt: '2026-10-26T12:00:00', endedEarly:false, feedback:'Bien' }],
}});
eq(completed.moveSummary, {requested:3,completed:1,scheduled:2}, 'historial real reduce sesiones restantes');
ok(!completed.moveSlots.some(s=>s.date==='2026-10-26'), 'no repite Move en día ya entrenado');
const nextWeek=proposeWeeklyPlan({...input, weekOffset:1});
eq(nextWeek.weekStart,'2026-11-02','siguiente semana');
eq(nextWeek.moveSummary?.completed,0,'historial de semana anterior no cuenta en próxima');

const nightWeek={
  ...defaultWeekState,
  shifts:defaultWeekState.shifts.map(s=>s.day===1 ? {...s,type:'night' as const,start:'21:00',end:'05:00'} : s),
};
const overnight = proposeWeeklyPlan({...input, week:nightWeek});
ok(!overnight.moveSlots.some(s=>s.date==='2026-10-28'),'no entrena el día posterior a turno nocturno');
ok(overnight.warnings.some(x=>x.includes('nocturnos')),'advierte adaptación de noches');
console.log('Move as independent weekly pillar regression tests passed.');
