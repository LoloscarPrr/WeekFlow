import type { RestView } from '@/src/application/useCases/getRestView';
import { formatGardenDays, type ConfigurableGardenPillarKey, type GardenPreferences } from './preferences';
import type { FoodDayRecord, MoveSessionRecord } from '@/src/state/persistence';

export type GardenStatus = 'Equilibrado' | 'Necesita atención' | 'Planificado' | 'Sin datos';

export type GardenPillarSummary = {
  key: 'rest' | 'food' | 'move' | ConfigurableGardenPillarKey;
  icon: string;
  title: string;
  evidence: string;
  status: GardenStatus;
  route: '/rest' | '/food' | '/pillars' | null;
  configurable?: boolean;
  planDays?: number[];
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

function plannedPillar(
  key: ConfigurableGardenPillarKey,
  icon: string,
  title: string,
  preferences: GardenPreferences,
): GardenPillarSummary {
  const plan = preferences[key];
  return {
    key,
    icon,
    title,
    evidence: plan ? formatGardenDays(plan.days) : 'Aún sin datos.',
    status: plan ? 'Planificado' : 'Sin datos',
    route: null,
    configurable: true,
    planDays: plan?.days,
  };
}

export function buildGardenPillars(input: {
  moveHistory: MoveSessionRecord[];
  foodHistory: FoodDayRecord[];
  restView: RestView;
  preferences?: GardenPreferences;
  now?: Date;
}): GardenPillarSummary[] {
  const now = input.now ?? new Date();
  const moveCount = moveSessionsThisWeek(input.moveHistory, now);
  const foodCount = foodMomentsThisWeek(input.foodHistory, now);
  const hasRestPlan = input.restView.content.kind !== 'empty';
  const preferences = input.preferences ?? {};

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
      evidence: `${moveCount} ${moveCount === 1 ? 'sesión' : 'sesiones'} esta semana.`,
      status: moveCount > 0 ? 'Equilibrado' : 'Necesita atención',
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
    plannedPillar('relationships', '🫶', 'Relaciones', preferences),
    plannedPillar('wellbeing', '🌿', 'Bienestar', preferences),
    plannedPillar('home', '🏠', 'Hogar', preferences),
    plannedPillar('responsibilities', '🧭', 'Responsabilidades', preferences),
    plannedPillar('personal', '☀️', 'Tiempo personal', preferences),
  ];
}
