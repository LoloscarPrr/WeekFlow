import type { RestView } from '@/src/application/useCases/getRestView';
import type { FoodDayRecord, MoveSessionRecord } from '@/src/state/persistence';
import type { HabitsState } from '@/src/habits/core';
import { resolveGardenCategory, GARDEN_HABIT_CATEGORIES, type GardenHabitCategory } from '../habits/categories';
import type { ConfirmedWeeklyPlan } from '@/src/brain/weeklyPlanPersistence';

export type GardenStatus = 'Equilibrado' | 'Necesita atención' | 'Sin datos' | 'Por configurar' | 'En curso' | 'Con registros';

export type GardenPillarSummary = {
  key: 'rest' | 'food' | 'move' | 'relationships' | 'wellbeing' | 'home' | 'responsibilities' | 'personal';
  icon: string;
  title: string;
  evidence: string;
  status: GardenStatus;
  route: '/rest' | '/food' | '/pillars' | '/habits' | null;
};

function mondayStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  return start;
}

function nextMonday(date: Date) {
  const end = mondayStart(date);
  end.setDate(end.getDate() + 7);
  return end;
}

function dateFromLocalKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function moveSessionsThisWeek(records: MoveSessionRecord[], now = new Date()) {
  const start = mondayStart(now);
  const end = nextMonday(now);
  return records.filter((record) => {
    const finishedAt = new Date(record.finishedAt);
    return Number.isFinite(finishedAt.getTime()) && finishedAt >= start && finishedAt < end;
  }).length;
}

export function foodMomentsThisWeek(records: FoodDayRecord[], now = new Date()) {
  const start = mondayStart(now);
  const end = nextMonday(now);
  return records.reduce((total, day) => {
    const date = dateFromLocalKey(day.date);
    if (!Number.isFinite(date.getTime()) || date < start || date >= end) return total;
    return total + day.entries.length;
  }, 0);
}

export function buildGardenPillars(input: {
  moveHistory: MoveSessionRecord[];
  foodHistory: FoodDayRecord[];
  restView: RestView;
  habitsState?: HabitsState;
  confirmedWeek?: ConfirmedWeeklyPlan | null;
  now?: Date;
}): GardenPillarSummary[] {
  const now = input.now ?? new Date();
  const moveCount = moveSessionsThisWeek(input.moveHistory, now);
  const foodCount = foodMomentsThisWeek(input.foodHistory, now);
  const hasRestPlan = input.restView.content.kind !== 'empty';
  const start = mondayStart(now);
  const end = nextMonday(now);
  const plannedMoveCount = input.confirmedWeek?.weekStart === [
    start.getFullYear(), String(start.getMonth()+1).padStart(2,'0'), String(start.getDate()).padStart(2,'0'),
  ].join('-') ? (input.confirmedWeek.moveSlots ?? []).length : 0;
  const categories = GARDEN_HABIT_CATEGORIES.map(({ key, icon, title }) => {
    const habits = (input.habitsState?.habits ?? []).filter(habit =>
      habit.active && resolveGardenCategory(habit) === key);
    const ids = new Set(habits.map(habit => habit.id));
    const completed = (input.habitsState?.completions ?? []).filter(record => {
      if (!ids.has(record.habitId)) return false;
      const [year, month, day] = record.date.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12);
      return Number.isFinite(date.getTime()) && date >= start && date < end;
    }).length;
    const target = habits.reduce((sum, habit) => sum + habit.targetPerWeek, 0);
    return {
      key: key as GardenHabitCategory, icon, title,
      evidence: habits.length === 0
        ? 'Sin hábitos asignados · Toca para configurar.'
        : `${habits.length} ${habits.length === 1 ? 'hábito' : 'hábitos'} · ${completed}/${target} ocasiones registradas esta semana.`,
      status: (habits.length === 0 ? 'Por configurar' : completed > 0 ? 'Con registros' : 'En curso') as GardenStatus,
      route: '/habits' as const,
    };
  });

  return [
    {
      key: 'rest',
      icon: '😴',
      title: 'Descanso',
      evidence: hasRestPlan ? 'Plan de recuperación activo.' : 'Aún sin plan calculado.',
      status: hasRestPlan ? 'Equilibrado' : 'Sin datos',
      route: '/rest',
    },
    {
      key: 'move',
      icon: '🏃',
      title: 'Movimiento',
      evidence: moveCount > 0
        ? `${moveCount} ${moveCount === 1 ? 'sesión realizada' : 'sesiones realizadas'} esta semana.`
        : plannedMoveCount > 0
          ? `0 realizadas · ${plannedMoveCount} programadas por Brain.`
          : '0 sesiones esta semana.',
      status: moveCount > 0 ? 'Equilibrado' : plannedMoveCount > 0 ? 'En curso' : 'Necesita atención',
      route: '/pillars',
    },
    {
      key: 'food',
      icon: '🍽️',
      title: 'Alimentación',
      evidence: `${foodCount} ${foodCount === 1 ? 'momento registrado' : 'momentos registrados'} esta semana.`,
      status: foodCount > 0 ? 'Equilibrado' : 'Necesita atención',
      route: '/food',
    },
    ...categories,
  ];
}
