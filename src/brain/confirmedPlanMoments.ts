import type { BrainMoment } from '../domain/entities/Planning';
import type { HabitsState } from '../habits/core';
import type { ConfirmedWeeklyPlan } from './weeklyPlanPersistence';
import { localHabitDateKey } from '../habits/core';
import type { MoveSessionRecord } from '../state/persistence';

export function confirmedMomentsForNow(
  plan: ConfirmedWeeklyPlan | null, habits: HabitsState, now: Date,
  moveHistory: readonly MoveSessionRecord[] = [],
): { item: BrainMoment; at: Date }[] {
  if (!plan) return [];
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  if (localHabitDateKey(monday) !== plan.weekStart) return [];
  const completedIds = new Set(moveHistory
    .filter(record => !record.endedEarly && record.scheduledMoveId)
    .map(record => record.scheduledMoveId));
  const moveMoments = (plan.moveSlots ?? []).flatMap(slot => {
    if (completedIds.has(slot.id)) return [];
    const [year, month, day] = slot.date.split('-').map(Number);
    const [hour, minute] = slot.start.split(':').map(Number);
    const at = new Date(year, month - 1, day, hour, minute);
    // Keep today's missed window visible until midnight: it is still a
    // confirmed but uncompleted Move session, not a disposable suggestion.
    const isToday = slot.date === localHabitDateKey(now);
    if ((!isToday && at < now) || Number.isNaN(at.getTime())) return [];
    return [{
      at: at < now ? now : at,
      item: {
        time: slot.start,
        dateLabel: slot.date,
        icon: '🏃',
        title: 'Move · ' + slot.muscles,
        detail: slot.durationMin + ' min · ' + slot.intensity
          + (at < now ? ' · pendiente de hoy' : ' · sesión confirmada por Brain')
          + '. Revisa tu energía antes de empezar.',
        type: 'move' as const,
        flexible: true,
        plannedMoveId: slot.id,
      },
    }];
  });
  const habitMoments = plan.slots.flatMap(slot => {
    const habit = habits.habits.find(h => h.id === slot.habitId && h.active);
    if (!habit || habits.completions.some(c => c.habitId === slot.habitId && c.date === slot.date)) return [];
    const [year, month, day] = slot.date.split('-').map(Number);
    const [hour, minute] = slot.start.split(':').map(Number);
    const at = new Date(year, month - 1, day, hour, minute);
    if (at < now) return [];
    return [{
      at,
      item: {
        time: slot.start,
        dateLabel: slot.date,
        icon: '🌱',
        title: habit.name,
        detail: slot.variant === 'mini' ? 'Hábito confirmado · versión mini' : 'Hábito confirmado para esta semana',
        type: 'personal' as const,
        flexible: true,
      },
    }];
  });
  return [...moveMoments, ...habitMoments];
}
