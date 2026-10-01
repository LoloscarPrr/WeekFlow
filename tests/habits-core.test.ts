import {
  completeHabit,
  completionForDate,
  completionsThisWeek,
  sanitizeHabitsState,
  undoHabitCompletion,
  upsertHabit,
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

state = completeHabit(state, 'leer', 'full', new Date(2026, 9, 1, 10, 0));
equal(completionForDate(state, 'leer', new Date(2026, 9, 1))?.mode, 'full', 'registra hecho completo');

state = completeHabit(state, 'leer', 'mini', new Date(2026, 9, 1, 18, 0));
equal(state.completions.length, 1, 'full y mini del mismo día no duplican registro');
equal(completionForDate(state, 'leer', new Date(2026, 9, 1))?.mode, 'mini', 'mini reemplaza registro del día');

state = completeHabit(state, 'leer', 'full', new Date(2026, 9, 3, 12, 0));
equal(completionsThisWeek(state, 'leer', new Date(2026, 9, 3)), 2, 'full y mini cuentan como momentos válidos de la semana');

state = upsertHabit(
  state,
  { name: 'Leer antes de dormir', miniVersion: '1 página', targetPerWeek: 99 },
  { id: 'leer', now: new Date(2026, 9, 3, 13, 0) },
);
equal(state.habits[0].name, 'Leer antes de dormir', 'editar mantiene id');
equal(state.habits[0].targetPerWeek, 7, 'frecuencia inválida se sanea al rango');
equal(state.completions.length, 2, 'editar no borra historial');

state = undoHabitCompletion(state, 'leer', new Date(2026, 9, 3));
equal(completionForDate(state, 'leer', new Date(2026, 9, 3)), null, 'deshacer deja el día pendiente');
equal(state.completions.length, 1, 'deshacer solo quita el día indicado');

const sanitized = sanitizeHabitsState({
  habits: [
    { id: 'ok', name: 'Caminar', targetPerWeek: 0, active: true },
    { id: '', name: 'Inválido', targetPerWeek: 3 },
  ],
  completions: [
    { habitId: 'ok', date: '2026-10-01', mode: 'full' },
    { habitId: 'fantasma', date: '2026-10-01', mode: 'full' },
  ],
});
equal(sanitized.habits.length, 1, 'descarta hábitos corruptos');
equal(sanitized.habits[0].targetPerWeek, 1, 'sanea frecuencia mínima');
equal(sanitized.completions.length, 1, 'descarta registros de hábitos inexistentes');
ok(sanitized.completions[0].completedAt, 'rellena timestamp faltante sin romper carga');\nconsole.log('✓ Habits soporta frecuencia flexible, mini-versiones, edición, undo y persistencia saneable');
