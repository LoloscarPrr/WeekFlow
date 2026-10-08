import { getNowView } from '../application/useCases/getNowView';
import { getRestView } from '../application/useCases/getRestView';
import type { DayState, Energy } from '../domain/entities/DailyState';
import type { WeekSchedule } from '../domain/entities/Shift';
import type { UserProfile } from '../domain/entities/UserProfile';
import { localDateKey } from '../domain/services/shiftSchedule';
import type { FoodDayRecord } from '../food/history';

export type AssistantMoveRecord = {
  finishedAt: string;
};

export type AssistantRealStateInput = {
  profile: UserProfile;
  dayState: DayState;
  weekState: WeekSchedule;
  moveHistory: AssistantMoveRecord[];
  foodDay: FoodDayRecord;
  now: Date;
};

export type AssistantRealState = {
  generatedAt: string;
  name: string | null;
  energy: Energy;
  energyLabel: string;
  liveTitle: string;
  liveMeta: string;
  jornadaLabel: string;
  phase: string;
  move: {
    doneToday: boolean;
    label: string;
  };
  food: {
    countToday: number;
    label: string;
    lastTitle: string | null;
  };
  rest: {
    title: string;
    meta: string;
  };
};

const ENERGY_LABEL: Record<Energy, string> = {
  vigoroso: 'Con energía',
  bien: 'Bien',
  cansado: 'Cansado',
  agotado: 'Agotado',
};

function moveDoneToday(moveHistory: AssistantMoveRecord[], now: Date) {
  const key = localDateKey(now);
  return moveHistory.some((item) => {
    const finishedAt = new Date(item.finishedAt);
    return !Number.isNaN(finishedAt.getTime()) && localDateKey(finishedAt) === key;
  });
}

function lastFoodTitle(foodDay: FoodDayRecord) {
  const sorted = [...foodDay.entries].sort((a, b) => a.at.localeCompare(b.at));
  return sorted.at(-1)?.title ?? null;
}

export function buildAssistantRealState({
  profile,
  dayState,
  weekState,
  moveHistory,
  foodDay,
  now,
}: AssistantRealStateInput): AssistantRealState {
  const moveDone = moveDoneToday(moveHistory, now);
  const nowView = getNowView({
    dayState,
    weekState,
    moveDoneToday: moveDone,
    now,
  });
  const restView = getRestView(dayState, weekState, now);
  const lastFood = lastFoodTitle(foodDay);
  const count = foodDay.entries.length;

  return {
    generatedAt: now.toISOString(),
    name: profile.name.trim() || null,
    energy: dayState.energy,
    energyLabel: ENERGY_LABEL[dayState.energy],
    liveTitle: nowView.live.title,
    liveMeta: nowView.live.blue,
    jornadaLabel: nowView.jornadaLabel,
    phase: nowView.phase,
    move: {
      doneToday: moveDone,
      label: moveDone ? 'Hecho hoy' : 'Sin sesión terminada hoy',
    },
    food: {
      countToday: count,
      label: count === 0
        ? 'Sin registros hoy'
        : `${count} ${count === 1 ? 'registro' : 'registros'} hoy`,
      lastTitle: lastFood,
    },
    rest: {
      title: restView.contextTitle,
      meta: restView.contextMeta,
    },
  };
}
