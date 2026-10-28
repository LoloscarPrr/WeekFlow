import type { WeekSchedule } from '../domain/entities/Shift';
import type { HabitsState } from '../habits/core';
import type { HabitConstraintIntent } from '../assistant/habitConstraints';
import { loadHabitsState, saveHabitsState } from '../habits/persistence';
import { loadWeekState } from '../state/persistence';
import { loadConfirmedWeeklyPlan, writeConfirmedWeeklyPlanSnapshot, type ConfirmedWeeklyPlan } from './weeklyPlanPersistence';
import { proposeHabitConstraintChange } from './habitConstraintChange';

export type HabitConstraintPreview = {
  intent: HabitConstraintIntent;
  beforeHabits: HabitsState;
  beforePlan: ConfirmedWeeklyPlan | null;
  beforeWeek: WeekSchedule;
  removed: number;
};

export type HabitConstraintUndo = {
  beforeHabits: HabitsState;
  beforePlan: ConfirmedWeeklyPlan | null;
  afterHabits: HabitsState;
  afterPlan: ConfirmedWeeklyPlan | null;
};

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export function previewHabitConstraint(intent: HabitConstraintIntent, now = new Date()): HabitConstraintPreview | null {
  const beforeHabits = loadHabitsState();
  const beforePlan = loadConfirmedWeeklyPlan();
  const beforeWeek = loadWeekState();
  const next = proposeHabitConstraintChange(beforeHabits, beforePlan, beforeWeek, intent, now);
  if (same(next.nextState, beforeHabits)) return null;
  return { intent, beforeHabits, beforePlan, beforeWeek, removed: next.removed };
}

export function confirmHabitConstraint(
  preview: HabitConstraintPreview, now = new Date(),
): { ok: boolean; message: string; undo?: HabitConstraintUndo } {
  const beforeHabits = loadHabitsState();
  const beforePlan = loadConfirmedWeeklyPlan();
  const beforeWeek = loadWeekState();
  if (!same(preview.beforeHabits, beforeHabits) || !same(preview.beforePlan, beforePlan)
    || !same(preview.beforeWeek, beforeWeek)) {
    return { ok: false, message: 'Cambió el calendario o los hábitos mientras revisabas esta propuesta. Vuelve a pedir el cambio.' };
  }
  const next = proposeHabitConstraintChange(beforeHabits, beforePlan, beforeWeek, preview.intent, now);
  if (same(next.nextState, beforeHabits)) return { ok: false, message: 'La regla ya estaba aplicada o la fecha dejó de ser válida.' };

  // Keep the booked calendar safe first, then update the habit rule. Both
  // writes are synchronous local operations; there is no remote AI mutation.
  if (!same(next.nextPlan, beforePlan)) writeConfirmedWeeklyPlanSnapshot(next.nextPlan);
  const afterHabits = saveHabitsState(next.nextState);
  return {
    ok: true,
    message: preview.intent.kind === 'off-days'
      ? 'Regla guardada: «' + preview.intent.habitName + '» solo se organizará en días libres.'
        + (next.removed ? ' Retiré ' + next.removed + ' bloque(s) incompatibles del plan confirmado.' : '')
        + ' Reorganiza la semana para repartir las ocasiones pendientes.'
      : 'Excepción guardada: «' + preview.intent.habitName + '» no se programará el ' + preview.intent.date
        + (next.removed ? '. Quité su bloque confirmado para ese día.' : '.')
        + ' El hábito y sus registros anteriores siguen intactos.',
    undo: {
      beforeHabits, beforePlan,
      afterHabits, afterPlan: next.nextPlan,
    },
  };
}

export function undoHabitConstraint(receipt: HabitConstraintUndo): { ok: boolean; message: string } {
  const currentHabits = loadHabitsState();
  const currentPlan = loadConfirmedWeeklyPlan();
  if (!same(currentHabits, receipt.afterHabits) || !same(currentPlan, receipt.afterPlan)) {
    return { ok: false, message: 'Otro cambio modificó Hábitos o Semana. No puedo deshacerlo sin sobrescribir datos más recientes.' };
  }
  if (!same(currentPlan, receipt.beforePlan)) writeConfirmedWeeklyPlanSnapshot(receipt.beforePlan);
  saveHabitsState(receipt.beforeHabits);
  return { ok: true, message: 'Deshice la última regla o excepción. Se restauraron tus hábitos y el plan anterior.' };
}
