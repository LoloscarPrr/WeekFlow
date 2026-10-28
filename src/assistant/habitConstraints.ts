import type { Habit, HabitsState, HabitDayRule } from '../habits/core';
import { localHabitDateKey } from '../habits/core';

export type HabitConstraintIntent =
  | { kind: 'off-days'; habitId: string; habitName: string; rule: HabitDayRule }
  | { kind: 'skip-date'; habitId: string; habitName: string; date: string };

export function normalizeHabitText(input: string): string {
  return input.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function uniquelyNamedHabit(message: string, habits: readonly Habit[]): Habit | null {
  const active = habits.filter(h => h.active);
  const hits = active.filter(habit => {
    const name = normalizeHabitText(habit.name);
    if (!name) return false;
    const full = ' ' + message + ' ';
    if (full.includes(' ' + name + ' ')) return true;
    // Verbal names ("Leer un rato"): accept "no voy a leer" if unique.
    if (name.startsWith('leer ') && /\bleer\b/.test(message)) return true;
    return false;
  });
  return hits.length === 1 ? hits[0] : null;
}

/** Deliberately narrow, offline command parser: no inferred availability. */
export function parseHabitConstraintIntent(
  input: string, state: HabitsState, now = new Date(),
): HabitConstraintIntent | null {
  const message = normalizeHabitText(input);
  if (!message || message.length > 250
    || /\b(ayer|anteayer|pasado manana|nunca mas|eliminar|borra|borre|elimine|todos los habitos)\b/.test(message)) return null;
  const habit = uniquelyNamedHabit(message, state.habits);
  if (!habit) return null;

  const offDay = /\b(dias? libres?|solo cuando (?:estoy|este|tenga) libre|unicamente los libres)\b/.test(message);
  const only = /\b(solo|solamente|unicamente|exclusivamente|nada mas)\b/.test(message);
  const plan = /\b(organice|organizar|programa|programar|planifica|planificar|reservar|quiero|necesito|dejar|deja|hacer)\b/.test(message);
  if (offDay && only && plan && !/\b(no|excepto|sin)\b/.test(message)) {
    return { kind: 'off-days', habitId: habit.id, habitName: habit.name, rule: 'off-days' };
  }

  // One occurrence is skipped; the habit's overall frequency and history stay.
  const tomorrow = /\bmanana\b/.test(message);
  const negative = /\b(no voy a|no puedo|no podre|no quiero|no alcanzare|no hare|saltarme|omitir|omito)\b/.test(message);
  if (tomorrow && negative && !offDay) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return { kind: 'skip-date', habitId: habit.id, habitName: habit.name, date: localHabitDateKey(date) };
  }
  return null;
}
