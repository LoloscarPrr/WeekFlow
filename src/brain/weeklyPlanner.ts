import type { WeekSchedule } from '../domain/entities/Shift';
import type { DaySettings, Energy } from '../domain/entities/DailyState';
import type { HabitsState, Habit } from '../habits/core';
import { localHabitDateKey, completionsThisWeek } from '../habits/core';

/** Pure preview engine. Never writes to SQLite or changes an existing habit. */
export type WeeklySlot = {
  id: string;
  habitId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  variant: 'full' | 'mini';
  explanation: string;
};
export type WeeklyShortfall = { habitId: string; title: string; requested: number; scheduled: number; completed: number };
export type WeeklyProposal = {
  weekStart: string;
  createdAt: string;
  slots: WeeklySlot[];
  shortfalls: WeeklyShortfall[];
  warnings: string[];
  status: 'preview';
};
export type PlannerInput = {
  week: WeekSchedule;
  habits: HabitsState;
  settings: DaySettings;
  energy: Energy;
  now: Date;
  durationByHabit?: Record<string, number>;
};

const MINUTE = 60000;
function dayAt(date: Date, minutes: number) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(minutes);
  return next;
}
function minuteOf(value: string) {
  const parts = /^(\d{2}):(\d{2})$/.exec(value);
  if (!parts) return null;
  const h = Number(parts[1]), m = Number(parts[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}
function clock(date: Date) {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
function overlaps(a: Date, b: Date, c: Date, d: Date) {
  return a < d && c < b;
}
function getMonday(now: Date) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}
function workingIntervals(week: WeekSchedule, monday: Date) {
  const out: { start: Date; end: Date; kind: 'work' | 'event' }[] = [];
  // Include preceding Sunday so its overnight recovery is accounted for on Monday.
  for (let offset = -1; offset < 7; offset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + offset);
    const day = (date.getDay() + 6) % 7;
    const shift = week.shifts.find(s => s.day === day);
    const a = shift ? minuteOf(shift.start) : null;
    const b = shift ? minuteOf(shift.end) : null;
    if (!shift || shift.type === 'off' || a === null || b === null) continue;
    const start = dayAt(date, a);
    const end = dayAt(date, b <= a ? b + 1440 : b);
    out.push({ start, end, kind: 'work' });
  }
  for (const event of week.importantMoments) {
    const eventDate = new Date(event.date + 'T12:00:00');
    const minutes = minuteOf(event.time);
    if (Number.isNaN(eventDate.getTime()) || minutes === null) continue;
    const start = dayAt(eventDate, minutes);
    // The current model has no event duration. Protect a conservative 60 minute window.
    out.push({ start, end: new Date(start.getTime() + 60 * MINUTE), kind: 'event' });
  }
  return out;
}
function protectedIntervals(
  week: WeekSchedule, monday: Date, settings: DaySettings,
) {
  const shifts = workingIntervals(week, monday);
  const blocked = shifts.map(s => ({ start: new Date(s.start), end: new Date(s.end) }));
  for (const s of shifts.filter(s => s.kind === 'work')) {
    const startMargin = Math.max(0, settings.commuteOutMin + settings.bufferMin + settings.prepMin);
    const endMargin = Math.max(0, settings.commuteBackMin + settings.recoveryMin);
    blocked.push({ start: new Date(s.start.getTime() - startMargin * MINUTE), end: s.start });
    blocked.push({ start: s.end, end: new Date(s.end.getTime() + endMargin * MINUTE) });
    // Protect the post-night sleep: free time is not automatically usable time.
    if (s.end.getDate() !== s.start.getDate() || s.start.getHours() >= 19) {
      const sleepAt = new Date(s.end.getTime() + endMargin * MINUTE);
      blocked.push({ start: sleepAt, end: new Date(sleepAt.getTime() + 8 * 60 * MINUTE) });
    }
  }
  return blocked;
}
function durationFor(habit: Habit, input: PlannerInput) {
  const configured = input.durationByHabit?.[habit.id];
  const base = Number.isFinite(configured) && configured! > 0 ? configured! : 30;
  const full = Math.min(120, Math.max(10, Math.round(base / 5) * 5));
  const mini = Boolean(habit.miniVersion) && (input.energy === 'cansado' || input.energy === 'agotado');
  return { duration: mini ? Math.min(15, full) : full, variant: mini ? 'mini' as const : 'full' as const };
}
export function proposeWeeklyPlan(input: PlannerInput): WeeklyProposal {
  const monday = getMonday(input.now);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return date;
  });
  const protectedTimes = protectedIntervals(input.week, monday, input.settings);
  const slots: WeeklySlot[] = [];
  const warnings: string[] = [];
  const active = input.habits.habits.filter(h => h.active);
  const scheduledByHabit = new Map<string, number>();
  const completedByHabit = new Map<string, number>();
  // Spread scarce targets before packing more occurrences of the same habit.
  const needs = active.flatMap(h => {
    const completed = completionsThisWeek(input.habits, h.id, input.now);
    completedByHabit.set(h.id, completed);
    const remaining = Math.max(0, h.targetPerWeek - completed);
    return Array.from({ length: remaining }, (_, index) => ({ habit: h, index }));
  }).sort((a, b) => a.index - b.index || b.habit.targetPerWeek - a.habit.targetPerWeek || a.habit.id.localeCompare(b.habit.id));

  for (const need of needs) {
    const habit = need.habit;
    const { duration, variant } = durationFor(habit, input);
    let best: { date: Date; start: Date; score: number } | null = null;
    for (let i = 0; i < 7; i++) {
      const day = dates[i];
      const key = localHabitDateKey(day);
      if (input.habits.completions.some(c => c.habitId === habit.id && c.date === key)) continue;
      if (slots.some(s => s.habitId === habit.id && s.date === key)) continue;
      const dayCount = slots.filter(s => s.date === key).length;
      if (dayCount >= (input.energy === 'agotado' ? 1 : 2)) continue;
      // Daily planning horizon is intentionally limited; don't infer a wake-up time.
      for (let minute = 10 * 60; minute <= 20 * 60 - duration; minute += 30) {
        const start = dayAt(day, minute);
        const end = new Date(start.getTime() + duration * MINUTE);
        if (start <= input.now) continue;
        if (protectedTimes.some(p => overlaps(start, end, p.start, p.end))) continue;
        if (slots.some(s => overlaps(start, end, new Date(s.date + 'T' + s.start + ':00'), new Date(s.date + 'T' + s.end + ':00')))) continue;
        // Strongly prefer different days and avoid stacking all habits on Sunday.
        const score = dayCount * 100 + Math.abs(i - (need.index * 7 / Math.max(1, habit.targetPerWeek))) * 9 + Math.abs(minute - 15 * 60) / 60;
        if (!best || score < best.score) best = { date: day, start, score };
      }
    }
    if (!best) continue;
    const end = new Date(best.start.getTime() + duration * MINUTE);
    const date = localHabitDateKey(best.date);
    slots.push({
      id: habit.id + '@' + date,
      habitId: habit.id,
      title: variant === 'mini' ? habit.miniVersion || habit.name : habit.name,
      date, start: clock(best.start), end: clock(end), durationMin: duration, variant,
      explanation: variant === 'mini' ? 'Versión breve sugerida por energía baja.' : 'Espacio disponible sin conflicto con trabajo y recuperación.',
    });
    scheduledByHabit.set(habit.id, (scheduledByHabit.get(habit.id) || 0) + 1);
  }
  const shortfalls = active.flatMap(h => {
    const completed = completedByHabit.get(h.id) || 0;
    const scheduled = scheduledByHabit.get(h.id) || 0;
    return completed + scheduled < h.targetPerWeek ? [{ habitId: h.id, title: h.name, requested: h.targetPerWeek, scheduled, completed }] : [];
  });
  if (shortfalls.length) warnings.push('No hay espacios seguros suficientes para todos los objetivos; no se recorta el descanso para completarlos.');
  if (input.week.importantMoments.length) warnings.push('Los eventos actuales no tienen duración guardada: se reservan 60 minutos como protección provisional.');
  warnings.push('El descanso principal no tiene registro de hora real de despertar: no se generan alarmas ni cambios de sueño.');
  return {
    weekStart: localHabitDateKey(monday),
    createdAt: input.now.toISOString(),
    slots: slots.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
    shortfalls, warnings, status: 'preview',
  };
}
