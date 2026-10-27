import type { WeekSchedule } from '../domain/entities/Shift';
import type { DaySettings, Energy } from '../domain/entities/DailyState';
import type { HabitsState, Habit } from '../habits/core';
import { localHabitDateKey, completionsThisWeek } from '../habits/core';
import type { MovePreferences, MoveIntensity } from '../move/adaptation';
import { recommendMoveIntensity } from '../move/adaptation';
import { routineForDuration } from '../move/library';
import { describeTargetMuscles } from '../move/muscles';

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
export type WeeklyMoveSlot = {
  id: string;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  intensity: MoveIntensity;
  muscles: string;
  sampleExercises: string[];
  explanation: string;
};
export type WeeklyMoveSummary = { requested: number; completed: number; scheduled: number };
export type WeeklyShortfall = { habitId: string; title: string; requested: number; scheduled: number; completed: number };
export type WeeklyProposal = {
  weekStart: string;
  createdAt: string;
  slots: WeeklySlot[];
  // Move belongs to its own pillar; never forge a Habit entry for workouts.
  moveSlots: WeeklyMoveSlot[];
  moveSummary: WeeklyMoveSummary | null;
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
  weekOffset?: 0 | 1;
  /** Optional dated energy reports; otherwise use current energy conservatively. */
  energyByDate?: Record<string, Energy>;
  move?: {
    preferences: MovePreferences;
    history: ReadonlyArray<{
      finishedAt: string;
      endedEarly: boolean;
      feedback: string | null;
    }>;
  };
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
    // Match Brain's pre-shift wake calculation. A night-shift wake is not
    // available time: protect the preceding main sleep window as well.
    if (s.end.getDate() !== s.start.getDate() || s.start.getHours() >= 19) {
      const wakeLeadMin = settings.commuteOutMin + settings.bufferMin
        + settings.prepMin + settings.mealMin + 20;
      const wakeAt = new Date(s.start.getTime() - wakeLeadMin * MINUTE);
      blocked.push({ start: new Date(wakeAt.getTime() - 8 * 60 * MINUTE), end: wakeAt });
    }
    // Protect the post-night sleep: free time is not automatically usable time.
    if (s.end.getDate() !== s.start.getDate() || s.start.getHours() >= 19) {
      const sleepAt = new Date(s.end.getTime() + endMargin * MINUTE);
      blocked.push({ start: sleepAt, end: new Date(sleepAt.getTime() + 8 * 60 * MINUTE) });
    }
  }
  return blocked;
}
function durationFor(habit: Habit, input: PlannerInput, energy: Energy) {
  const configured = input.durationByHabit?.[habit.id];
  const base = Number.isFinite(configured) && configured! > 0 ? configured! : 30;
  const full = Math.min(120, Math.max(10, Math.round(base / 5) * 5));
  const mini = Boolean(habit.miniVersion) && (energy === 'cansado' || energy === 'agotado');
  return { duration: mini ? Math.min(15, full) : full, variant: mini ? 'mini' as const : 'full' as const };
}
export function proposeWeeklyPlan(input: PlannerInput): WeeklyProposal {
  const monday = getMonday(input.now);
  if (input.weekOffset === 1) monday.setDate(monday.getDate() + 7);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return date;
  });
  const protectedTimes = protectedIntervals(input.week, monday, input.settings);
  // Days following overnight work are recovery days, even when some time remains unblocked.
  const recoveryDates = new Set<string>();
  for (let i = -1; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const shift = input.week.shifts.find(s => s.day === (date.getDay() + 6) % 7);
    if (!shift || shift.type === 'off') continue;
    const start = minuteOf(shift.start);
    const end = minuteOf(shift.end);
    if (start === null || end === null) continue;
    if (end <= start || start >= 19 * 60) {
      const following = new Date(date);
      following.setDate(following.getDate() + 1);
      recoveryDates.add(localHabitDateKey(following));
    }
  }
  const slots: WeeklySlot[] = [];
  const warnings: string[] = [];
  const legacyMoveNames = new Set(['ejercicio', 'ejercicios', 'entrenamiento', 'entrenar', 'gimnasio', 'gym', 'move']);
  const targetMove = input.move?.preferences.weeklyTargetSessions ?? 0;
  const isLegacyMoveHabit = (name: string) => legacyMoveNames.has(name.trim().toLocaleLowerCase('es-CL'));
  const skippedLegacy = targetMove > 0
    ? input.habits.habits.filter(h => h.active && isLegacyMoveHabit(h.name))
    : [];
  const active = input.habits.habits.filter(h => h.active && !skippedLegacy.some(other => other.id === h.id));
  if (skippedLegacy.length) warnings.push('El hábito «Ejercicios» existente se conservó, pero no se duplicó: esta semana el entrenamiento se planifica directamente desde Move. Puedes editar ese hábito sin perder su historial.');
  const scheduledByHabit = new Map<string, number>();
  const completedByHabit = new Map<string, number>();
  // Spread scarce targets before packing more occurrences of the same habit.
  const needs = active.flatMap(h => {
    const completed = input.weekOffset === 1 ? 0 : completionsThisWeek(input.habits, h.id, input.now);
    completedByHabit.set(h.id, completed);
    const remaining = Math.max(0, h.targetPerWeek - completed);
    return Array.from({ length: remaining }, (_, index) => ({ habit: h, index }));
  }).sort((a, b) => a.index - b.index || b.habit.targetPerWeek - a.habit.targetPerWeek || a.habit.id.localeCompare(b.habit.id));

  const moveSlots: WeeklyMoveSlot[] = [];
  let moveSummary: WeeklyMoveSummary | null = null;
  if (input.move && targetMove > 0) {
    const prefs = input.move.preferences;
    const mondayKey = localHabitDateKey(monday);
    const sunday = dates[6];
    const sundayKey = localHabitDateKey(sunday);
    const completedDates = new Set(input.weekOffset === 1 ? [] : input.move.history
      .filter(item => !item.endedEarly && Number.isFinite(new Date(item.finishedAt).getTime()))
      .map(item => localHabitDateKey(new Date(item.finishedAt)))
      .filter(key => key >= mondayKey && key <= sundayKey));
    const remaining = Math.max(0, targetMove - completedDates.size);
    const previousFeedback = input.move.history[0]?.feedback;
    const previousEndedEarly = Boolean(input.move.history[0]?.endedEarly);
    const dayIndex = (key: string) => dates.findIndex(d => localHabitDateKey(d) === key);
    // Move takes priority over flexible habits; completed sessions are immutable.
    for (let n = 0; n < remaining; n++) {
      let best: { index: number; day: Date; start: Date; minutes: number; intensity: MoveIntensity;
        exerciseNames: string[]; score: number } | null = null;
      for (let i = 0; i < 7; i++) {
        const day = dates[i];
        const key = localHabitDateKey(day);
        if (recoveryDates.has(key) || completedDates.has(key) || moveSlots.some(slot => slot.date === key)) continue;
        if ([...completedDates, ...moveSlots.map(slot => slot.date)].some(used => Math.abs(dayIndex(used) - i) < 2)) continue;
        const energy = input.energyByDate?.[key] ?? input.energy;
        // Do not book a strength session on an explicitly exhausted day.
        if (energy === 'agotado') continue;
        const shift = input.week.shifts.find(s => s.day === i);
        const durationMin = (energy === 'cansado' || previousEndedEarly
          || previousFeedback === 'Difícil' || previousFeedback === 'Demasiado'
          || (shift && shift.type !== 'off'))
          ? 30 : prefs.preferredSessionMinutes;
        const intensity = recommendMoveIntensity(energy, prefs.experience, previousFeedback, previousEndedEarly);
        const routine = routineForDuration(durationMin, prefs, intensity, {
          lastFeedback: previousFeedback,
          lastEndedEarly: previousEndedEarly,
          previousExerciseIds: [],
        });
        const exerciseNames = [...new Set(routine.steps.flatMap(step => step.mode === 'amrap'
          ? (step.circuit ?? []).map(item => item.exercise.title)
          : [step.exercise.title]))].slice(0, 4);
        if (!exerciseNames.length) continue;
        for (let minute = 10 * 60; minute <= 20 * 60 - durationMin; minute += 30) {
          const start = dayAt(day, minute);
          const end = new Date(start.getTime() + durationMin * MINUTE);
          if (start <= input.now || protectedTimes.some(p => overlaps(start, end, p.start, p.end))) continue;
          const score = (shift && shift.type !== 'off' ? 170 : 0)
            + Math.abs(minute - 16 * 60) / 20
            + Math.abs(i - (n * 7 / Math.max(1, remaining))) * 14;
          if (!best || score < best.score) best = { index: i, day, start, minutes: durationMin, intensity, exerciseNames, score };
        }
      }
      if (!best) break;
      const end = new Date(best.start.getTime() + best.minutes * MINUTE);
      const date = localHabitDateKey(best.day);
      moveSlots.push({
        id: 'move@' + date,
        date, start: clock(best.start), end: clock(end),
        durationMin: best.minutes,
        intensity: best.intensity,
        muscles: describeTargetMuscles(prefs.targetMuscles),
        sampleExercises: best.exerciseNames,
        explanation: 'Move adapta los ejercicios y la intensidad al iniciar, según energía, equipamiento y feedback reales. Hora sugerida; confirma antes de reservar.',
      });
    }
    moveSummary = { requested: targetMove, completed: completedDates.size, scheduled: moveSlots.length };
    if (moveSummary.completed + moveSummary.scheduled < targetMove) {
      warnings.push('Move: no hay espacios seguros suficientes para todas las sesiones del objetivo semanal. Se priorizó el descanso.');
    }
    if (moveSlots.length) warnings.push('Las sesiones Move usan tu perfil actual como vista previa. La rutina se adapta a tu energía real al comenzar.');
  }

  for (const need of needs) {
    const habit = need.habit;
    let best: { date: Date; start: Date; score: number; duration: number; variant: 'full' | 'mini' } | null = null;
    for (let i = 0; i < 7; i++) {
      const day = dates[i];
      const key = localHabitDateKey(day);
      if (input.habits.completions.some(c => c.habitId === habit.id && c.date === key)) continue;
      if (slots.some(s => s.habitId === habit.id && s.date === key)) continue;
      // Same visible activity, even if registered under different habit IDs.
      const label = habit.name.trim().toLocaleLowerCase();
      if (slots.some(s => s.date === key && active.some(h => h.id === s.habitId && h.name.trim().toLocaleLowerCase() === label))) continue;
      const dayCount = slots.filter(s => s.date === key).length
        + moveSlots.filter(s => s.date === key).length;
      const isRecoveryDay = recoveryDates.has(key);
      const dailyEnergy = input.energyByDate?.[key] ?? (isRecoveryDay ? 'cansado' : input.energy);
      const { duration, variant } = durationFor(habit, input, dailyEnergy);
      // Recovery is non-negotiable. Never stack activities after a night shift.
      const maxDaily = isRecoveryDay || dailyEnergy === 'agotado' ? 1 : 2;
      if (dayCount >= maxDaily) continue;
      // Only use future time. Daily planning does not infer a wake-up time.
      for (let minute = 10 * 60; minute <= 20 * 60 - duration; minute += 30) {
        const start = dayAt(day, minute);
        const end = new Date(start.getTime() + duration * MINUTE);
        if (start <= input.now) continue;
        if (protectedTimes.some(p => overlaps(start, end, p.start, p.end))) continue;
        if (slots.some(s => overlaps(start, end, new Date(s.date + 'T' + s.start + ':00'), new Date(s.date + 'T' + s.end + ':00')))) continue;
        if (moveSlots.some(s => overlaps(start, end, new Date(s.date + 'T' + s.start + ':00'), new Date(s.date + 'T' + s.end + ':00')))) continue;
        // Strongly prefer different days and avoid stacking all habits on Sunday.
        const sameHabitDays = slots.filter(s => s.habitId === habit.id).map(s => dates.findIndex(d => localHabitDateKey(d) === s.date));
        const separationPenalty = sameHabitDays.reduce((total, usedDay) => total + (Math.abs(usedDay - i) === 1 ? 110 : Math.abs(usedDay - i) === 2 ? 25 : 0), 0);
        const plannedPosition = need.index * 7 / Math.max(1, habit.targetPerWeek);
        // Prefer spreading sessions, while reserving a lighter recovery day.
        const score = dayCount * 120 + separationPenalty + (isRecoveryDay ? 95 : 0)
          + Math.abs(i - plannedPosition) * 7 + Math.abs(minute - 15 * 60) / 60;
        if (!best || score < best.score) best = { date: day, start, score, duration, variant };
      }
    }
    if (!best) continue;
    const { duration, variant } = best;
    const end = new Date(best.start.getTime() + duration * MINUTE);
    const date = localHabitDateKey(best.date);
    slots.push({
      id: habit.id + '@' + date,
      habitId: habit.id,
      title: variant === 'mini' ? habit.miniVersion || habit.name : habit.name,
      date, start: clock(best.start), end: clock(end), durationMin: duration, variant,
      explanation: variant === 'mini' ? 'Versión breve sugerida según energía y recuperación de ese día.' : 'Espacio disponible sin conflicto con trabajo y recuperación.',
    });
    scheduledByHabit.set(habit.id, (scheduledByHabit.get(habit.id) || 0) + 1);
  }
  const shortfalls = active.flatMap(h => {
    const completed = completedByHabit.get(h.id) || 0;
    const scheduled = scheduledByHabit.get(h.id) || 0;
    return completed + scheduled < h.targetPerWeek ? [{ habitId: h.id, title: h.name, requested: h.targetPerWeek, scheduled, completed }] : [];
  });
  if (input.weekOffset === 0 && input.now.getDay() === 0) warnings.push('Queda poco de la semana actual: puedes seleccionar la próxima semana para distribuir tus hábitos.');
  if (recoveryDates.size) warnings.push('Se redujo la carga en días posteriores a turnos nocturnos para proteger la recuperación.');
  if (shortfalls.length) warnings.push('No hay espacios seguros suficientes para todos los objetivos; no se recorta el descanso para completarlos.');
  if (input.week.importantMoments.length) warnings.push('Los eventos actuales no tienen duración guardada: se reservan 60 minutos como protección provisional.');
  warnings.push('El descanso principal no tiene registro de hora real de despertar: no se generan alarmas ni cambios de sueño.');
  return {
    weekStart: localHabitDateKey(monday),
    createdAt: input.now.toISOString(),
    slots: slots.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
    moveSlots: moveSlots.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
    moveSummary,
    shortfalls, warnings, status: 'preview',
  };
}
