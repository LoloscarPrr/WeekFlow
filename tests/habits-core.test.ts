import {
  clearHabitPlan,
  completeHabit,
  completionForDate,
  completionsThisWeek,
  nextHabitPlanDates,
  replanHabit,
  sanitizeHabitsState,
  undoHabitCompletion,
  upsertHabit,
  visibleHabitPlan,
  type HabitsState,
} from '../src/habits/core';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const createdAt = new Date(2026, 9, 1, 9, 0);
let state: HabitsState = { habits: [], completions: [] };
state = upsertHabit(
  state,
  { name: '  Leer   un rato ', miniVersion: ' leer 2 páginas ', targetPerWeek: 3 },
  { id: 'leer', now: createdAt },
);

equal(state.habits.length, 1, 'crea un hábito');
equal(state.habits[0].name, 'Leer un rato', 'normaliza espacios del nombre');
equal(state.habits[0].miniVersion, 'leer 2 páginas', 'guarda mini-versión');
equal(state.habits[0].targetPerWeek, 3, 'guarda frecuencia flexible');
equal(state.habits[0].plannedFor, null, 'un hábito nuevo nace flexible');

const planOptions = nextHabitPlanDates(new Date(2026, 9, 2, 8, 0), 7);
equal(planOptions.length, 7, 'ofrece siete próximos días');
equal(planOptions[0], '2026-10-03', 'la primera opción es mañana local');
equal(planOptions[6], '2026-10-09', 'la séptima opción mantiene secuencia local');

state = replanHabit(state, 'leer', '2026-10-05', new Date(2026, 9, 2, 9, 0));
equal(state.habits[0].plannedFor, '2026-10-05', 'reprograma a una próxima ocasión');
equal(visibleHabitPlan(state.habits[0], new Date(2026, 9, 2)), '2026-10-05', 'muestra una fecha futura como plan activo');

const beforePastReplan = state;
state = replanHabit(state, 'leer', '2026-09-30', new Date(2026, 9, 2, 9, 0));
equal(state, beforePastReplan, 'rechaza reprogramación a una fecha pasada');

state = upsertHabit(
  state,
  { name: 'Leer antes de dormir', miniVersion: '1 página', targetPerWeek: 99 },
  { id: 'leer', now: new Date(2026, 9, 2, 10, 0) },
);
equal(state.habits[0].name, 'Leer antes de dormir', 'editar mantiene id');
equal(state.habits[0].targetPerWeek, 7, 'frecuencia inválida se sanea al rango');
equal(state.habits[0].plannedFor, '2026-10-05', 'editar conserva próxima ocasión');

state = clearHabitPlan(state, 'leer', new Date(2026, 9, 2, 11, 0));
equal(state.habits[0].plannedFor, null, 'dejar flexible limpia el plan');

state = replanHabit(state, 'leer', '2026-10-05', new Date(2026, 9, 2, 12, 0));
state = completeHabit(state, 'leer', 'full', new Date(2026, 9, 3, 10, 0));
equal(completionForDate(state, 'leer', new Date(2026, 9, 3))?.mode, 'full', 'permite completar antes de la fecha planeada');
equal(state.habits[0].plannedFor, null, 'completar limpia la próxima ocasión');

state = undoHabitCompletion(state, 'leer', new Date(2026, 9, 3));
equal(completionForDate(state, 'leer', new Date(2026, 9, 3)), null, 'deshacer deja el día pendiente');
equal(state.habits[0].plannedFor, null, 'deshacer no restaura una fecha antigua');

state = completeHabit(state, 'leer', 'full', new Date(2026, 9, 1, 10, 0));
equal(completionForDate(state, 'leer', new Date(2026, 9, 1))?.mode, 'full', 'registra hecho completo');

state = completeHabit(state, 'leer', 'mini', new Date(2026, 9, 1, 18, 0));
equal(state.completions.length, 1, 'full y mini del mismo día no duplican registro');
equal(completionForDate(state, 'leer', new Date(2026, 9, 1))?.mode, 'mini', 'mini reemplaza registro del día');

state = completeHabit(state, 'leer', 'full', new Date(2026, 9, 3, 12, 0));
equal(completionsThisWeek(state, 'leer', new Date(2026, 9, 3)), 2, 'full y mini cuentan como momentos válidos de la semana');

const sanitized = sanitizeHabitsState({
  habits: [
    { id: 'ok', name: 'Caminar', targetPerWeek: 0, active: true },
    { id: 'fecha-mala', name: 'Agua', targetPerWeek: 3, plannedFor: '2026-99-77', active: true },
    { id: '', name: 'Inválido', targetPerWeek: 3 },
  ],
  completions: [
    { habitId: 'ok', date: '2026-10-01', mode: 'full' },
    { habitId: 'fantasma', date: '2026-10-01', mode: 'full' },
  ],
});
equal(sanitized.habits.length, 2, 'descarta hábitos corruptos');
equal(sanitized.habits[0].targetPerWeek, 1, 'sanea frecuencia mínima');
equal(sanitized.habits[0].plannedFor, null, 'datos previos sin plannedFor cargan flexibles');
equal(sanitized.habits[1].plannedFor, null, 'fecha inválida se sanea a null');
equal(sanitized.completions.length, 1, 'descarta registros de hábitos inexistentes');
ok(sanitized.completions[0].completedAt, 'rellena timestamp faltante sin romper carga');

const stalePlan = sanitizeHabitsState({
  habits: [{ id: 'stale', name: 'Caminar', targetPerWeek: 2, plannedFor: '2026-10-01', active: true }],
  completions: [],
});
equal(visibleHabitPlan(stalePlan.habits[0], new Date(2026, 9, 2)), null, 'una fecha pasada deja de presentarse como compromiso activo');

console.log('✓ Habits soporta frecuencia flexible, mini-versiones y reprogramación sin culpa');
