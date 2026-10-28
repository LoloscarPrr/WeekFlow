import type { WeekSchedule } from '../domain/entities/Shift';
import type { Habit, HabitsState } from '../habits/core';
import { setHabitDayRule, skipHabitOnDate } from '../habits/core';
import type { HabitConstraintIntent } from '../assistant/habitConstraints';
import type { ConfirmedWeeklyPlan } from './weeklyPlanPersistence';

/** A pure preview; Move and unrelated habits never change. */
export function proposeHabitConstraintChange(
  state: HabitsState, plan: ConfirmedWeeklyPlan | null,
  week: WeekSchedule, intent: HabitConstraintIntent, now: Date,
): { nextState: HabitsState; nextPlan: ConfirmedWeeklyPlan | null; removed: number } {
  const nextState = intent.kind === 'off-days'
    ? setHabitDayRule(state, intent.habitId, intent.rule, now)
    : skipHabitOnDate(state, intent.habitId, intent.date, now);

  const nextHabit = nextState.habits.find(habit => habit.id === intent.habitId);
  if (!nextHabit || nextState === state || !plan) return { nextState, nextPlan: plan, removed: 0 };
  const eligible = (date: string, habit: Habit) => {
    if ((habit.skipDates ?? []).includes(date)) return false;
    if (habit.dayRule === 'off-days') {
      const day = new Date(date + 'T12:00:00');
      if (Number.isNaN(day.getTime())) return false;
      const mondayIndex = (day.getDay() + 6) % 7;
      if (week.shifts.find(shift => shift.day === mondayIndex)?.type !== 'off') return false;
    }
    return true;
  };
  const slots = plan.slots.filter(slot => slot.habitId !== intent.habitId || eligible(slot.date, nextHabit));
  const removed = plan.slots.length - slots.length;
  if (!removed) return { nextState, nextPlan: plan, removed };
  return {
    nextState,
    nextPlan: {
      ...plan, slots,
      warnings: [...plan.warnings, 'Se modificó la disponibilidad de un hábito. Reorganiza y confirma la semana para redistribuir sesiones pendientes.'],
    },
    removed,
  };
}
