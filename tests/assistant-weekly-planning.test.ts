import { parseWeeklyPlanningIntent } from '../src/assistant/weeklyIntent';
import { proposeWeeklyPlan } from '../src/brain/weeklyPlanner';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import { upsertHabit } from '../src/habits/core';

function same(a: unknown, b: unknown, label: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(label + ': got ' + JSON.stringify(a));
}
function ok(x: unknown, label: string) { if (!x) throw Error(label); }

for (const text of ['Organiza mi semana', 'Planifica mis hábitos', '¿Puedes organizar mi semana?', 'Reorganiza mis actividades semanales']) {
  same(parseWeeklyPlanningIntent(text), { weekOffset: 0 }, 'semana actual: ' + text);
}
for (const text of ['Organiza la próxima semana', 'Planifica mis hábitos para la semana que viene']) {
  same(parseWeeklyPlanningIntent(text), { weekOffset: 1 }, 'próxima semana: ' + text);
}
for (const text of [
  '', 'Estoy cansado', '¿Me conviene entrenar hoy?', 'Quiero entrenar espalda',
  'Mañana entro a las 10:00', 'Cambia el turno y organiza mi semana',
  'Organiza mis medicamentos de la semana', 'No quiero organizar mi semana',
  'Organiza mi semana sin cambiar turnos', 'Planifica la semana después de la próxima',
  'Organiza mis hábitos hoy a las 17:00', 'Si me siento bien organiza mis rutinas',
]) same(parseWeeklyPlanningIntent(text), null, 'no prometer acciones mezcladas: ' + text);

const monday = new Date(2026, 9, 26, 8, 0);
let habits = { habits: [], completions: [] } as ReturnType<typeof upsertHabit>;
habits = upsertHabit(habits, { name: 'Leer', miniVersion: '2 páginas', targetPerWeek: 3 }, { id: 'read', now: monday });
habits = upsertHabit(habits, { name: 'Entrenamiento ligero', miniVersion: 'Movilidad', targetPerWeek: 2 }, { id: 'move', now: monday });
const week = {
  ...defaultWeekState,
  shifts: defaultWeekState.shifts.map(s => {
    if (s.day === 0) return { ...s, type: 'morning' as const, start: '09:00', end: '17:00' };
    if (s.day === 1) return { ...s, type: 'night' as const, start: '21:00', end: '05:00' };
    return s;
  }),
};
const input = {
  now: monday, week, habits,
  settings: defaultDayState.settings,
  energy: 'cansado' as const,
  weekOffset: 0 as const,
};
const original = JSON.stringify({week,habits});
const plan = proposeWeeklyPlan(input);
same(plan.status, 'preview', 'vista previa antes de confirmación');
ok(plan.slots.length > 0, 'genera sesiones a partir de hábitos');
ok(plan.slots.every(s => s.date >= '2026-10-26' && s.date <= '2026-11-01'), 'solo semana seleccionada');
ok(plan.slots.every(s => s.start < s.end), 'horas visibles correctas');
ok(plan.slots.every(s => !(s.date === '2026-10-26' && s.start >= '09:00' && s.start < '17:00')), 'no coloca hábitos dentro del trabajo del lunes');
ok(plan.slots.every(s => s.date !== '2026-10-28' || s.start >= '14:45'), 'protege 8h post turno nocturno martes-miércoles');
ok(plan.warnings.some(w => w.includes('descanso principal')), 'declara incertidumbre de sueño real');
same(JSON.stringify({week,habits}), original, 'no muta horarios ni hábitos');
const next = proposeWeeklyPlan({...input, weekOffset: 1});
same(next.weekStart, '2026-11-02', 'siguiente lunes con fecha real');
ok(next.slots.every(s => s.date >= '2026-11-02'), 'siguiente semana no mezcla fechas');
same(proposeWeeklyPlan({...input, habits: {habits:[],completions:[]}}).slots.length,0,'sin hábitos no crea sesiones');
console.log('Assistant weekly preview intent and scheduling tests passed.');
