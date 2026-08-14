import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import { assessExitReplanImpact, type ExitReplanImpact } from '@/src/brain/exitImpact';
import type { DayState } from '@/src/domain/entities/DailyState';
import type { BrainMoment, BrainPlan, BrainSnapshot } from '@/src/domain/entities/Planning';
import type { Shift, WeekSchedule } from '@/src/domain/entities/Shift';
import { shiftContextForDate, type ShiftContext } from '@/src/domain/services/shiftSchedule';

export type DayPhase = 'off' | 'before' | 'commuting' | 'working' | 'after';

export type WorkProgress = {
  percent: number;
  remaining: number;
};

export type NowLiveCard = {
  title: string;
  blue: string;
  copy: string;
  icon: string;
};

export type NowView = {
  shiftContext: ShiftContext;
  todayShift: Shift;
  snapshot: BrainSnapshot;
  basePlan: BrainPlan;
  plan: BrainPlan;
  hasActualExit: boolean;
  exitImpact: ExitReplanImpact | null;
  needsExitReview: boolean;
  phase: DayPhase;
  workProgress: WorkProgress | null;
  upcomingMoments: BrainMoment[];
  jornadaLabel: string;
  live: NowLiveCard;
};

export type GetNowViewInput = {
  dayState: DayState;
  weekState: WeekSchedule;
  moveDoneToday: boolean;
  now: Date;
};

function dateAtHm(base: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function phaseForShift(
  startAtIso: string | null,
  endAtIso: string | null,
  off: boolean,
  commuteOutMin: number,
  bufferMin: number,
  now: Date,
): DayPhase {
  if (off || !startAtIso || !endAtIso) return 'off';

  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);
  if (now >= startAt && now < endAt) return 'working';
  if (now >= endAt) return 'after';

  const leaveAt = new Date(startAt.getTime() - (commuteOutMin + bufferMin) * 60_000);
  if (now >= leaveAt) return 'commuting';
  return 'before';
}

function shiftProgress(startAtIso: string | null, endAtIso: string | null, now: Date): WorkProgress | null {
  if (!startAtIso || !endAtIso) return null;
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);
  const durationMs = endAt.getTime() - startAt.getTime();
  if (durationMs <= 0) return null;

  const elapsedMs = Math.max(0, Math.min(durationMs, now.getTime() - startAt.getTime()));
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  return {
    percent: Math.round((elapsedMs / durationMs) * 100),
    remaining: Math.ceil(remainingMs / 60_000),
  };
}

function datedPlanMoments(moments: BrainMoment[], shiftStartAtIso: string | null, now: Date) {
  if (!shiftStartAtIso) {
    return moments.map((item) => ({ item, at: dateAtHm(now, item.time) }));
  }

  const shiftStartAt = new Date(shiftStartAtIso);
  const workIndex = moments.findIndex((item) => item.type === 'work');
  let previous: Date | null = null;

  return moments.map((item, index) => {
    let at = dateAtHm(shiftStartAt, item.time);

    if (workIndex >= 0 && index < workIndex && at > shiftStartAt) {
      at.setDate(at.getDate() - 1);
    }

    if (workIndex >= 0 && index === workIndex) {
      at = new Date(shiftStartAt);
    }

    if (previous && at < previous) {
      at.setDate(at.getDate() + 1);
    }

    previous = at;
    return { item, at };
  });
}

function liveCard(
  dayState: DayState,
  todayShift: Shift,
  plan: BrainPlan,
  phase: DayPhase,
  hasActualExit: boolean,
  needsExitReview: boolean,
  moveDoneToday: boolean,
  upcomingMoments: BrainMoment[],
): NowLiveCard {
  if (hasActualExit && needsExitReview) {
    return {
      title: 'Salida real registrada',
      blue: `${dayState.actualExit} · Falta confirmar un cambio`,
      copy: 'Regreso y recuperación ya siguen tu salida real. Dejé los bloques flexibles fuera hasta que decidas si quieres moverlos.',
      icon: '✓',
    };
  }

  if (hasActualExit) {
    return {
      title: plan.headline,
      blue: `${dayState.actualExit} · Salida real`,
      copy: plan.primary.detail,
      icon: '✓',
    };
  }

  if (phase === 'working') {
    return {
      title: 'Trabajando ahora',
      blue: `${todayShift.start}–${todayShift.end} · Jornada en curso`,
      copy: 'Tu jornada está en curso. Cuando termines, toca “Ya salí” y WeekFlow reajustará solo lo flexible.',
      icon: '💼',
    };
  }

  if (phase === 'commuting') {
    return {
      title: 'En camino al trabajo',
      blue: `${todayShift.start} · Entrada`,
      copy: 'Ya estás en la ventana de traslado. Lo importante ahora es llegar con margen.',
      icon: '🚇',
    };
  }

  if (phase === 'after') {
    return {
      title: 'Jornada finalizada',
      blue: `${todayShift.end} · Salida programada`,
      copy: 'Si saliste a otra hora, registra la salida real para ajustar solo lo que viene después.',
      icon: '✓',
    };
  }

  const next = upcomingMoments[0];
  if (next) {
    return {
      title: plan.headline,
      blue: `${next.time} · ${next.title}`,
      copy: next.detail,
      icon: next.icon,
    };
  }

  if (moveDoneToday) {
    return {
      title: 'Lo importante de hoy ya está cubierto',
      blue: 'Move · Hecho',
      copy: 'No voy a inventarte otra tarea solo para llenar el día.',
      icon: '✓',
    };
  }

  return {
    title: 'Día despejado',
    blue: 'Sin pendientes inmediatos',
    copy: 'No hay una acción próxima que necesite competir por tu atención.',
    icon: '🌿',
  };
}

export function getNowView({ dayState, weekState, moveDoneToday, now }: GetNowViewInput): NowView {
  const shiftContext = shiftContextForDate(weekState, now);
  const todayShift = shiftContext.shift;
  const snapshot: BrainSnapshot = {
    ...dayState.settings,
    shift: todayShift,
    energy: dayState.energy,
  };
  const basePlan = buildBrainPlan(snapshot);
  const hasActualExit = Boolean(
    dayState.actualExit
    && dayState.actualExitAt
    && dayState.actualExitShiftKey === shiftContext.key
    && todayShift.type !== 'off',
  );
  const exitImpact = hasActualExit && dayState.actualExit
    ? assessExitReplanImpact(snapshot, basePlan, dayState.actualExit)
    : null;
  const needsExitReview = Boolean(exitImpact?.requiresConfirmation && !dayState.actualExitReplanConfirmed);
  const plan = hasActualExit && dayState.actualExit
    ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit, !needsExitReview)
    : basePlan;
  const phase = phaseForShift(
    shiftContext.startAt,
    shiftContext.endAt,
    todayShift.type === 'off',
    dayState.settings.commuteOutMin,
    dayState.settings.bufferMin,
    now,
  );
  const workProgress = phase === 'working'
    ? shiftProgress(shiftContext.startAt, shiftContext.endAt, now)
    : null;

  const upcomingMoments = datedPlanMoments(plan.moments, shiftContext.startAt, now)
    .filter(({ item, at }) => {
      if (moveDoneToday && item.type === 'move') return false;
      if (needsExitReview && item.flexible) return false;
      return at.getTime() >= now.getTime();
    })
    .map(({ item }) => item)
    .slice(0, 7);

  const jornadaLabel = snapshot.shift.type === 'off'
    ? 'Libre'
    : `${snapshot.shift.start}–${snapshot.shift.end}`;

  return {
    shiftContext,
    todayShift,
    snapshot,
    basePlan,
    plan,
    hasActualExit,
    exitImpact,
    needsExitReview,
    phase,
    workProgress,
    upcomingMoments,
    jornadaLabel,
    live: liveCard(
      dayState,
      todayShift,
      plan,
      phase,
      hasActualExit,
      needsExitReview,
      moveDoneToday,
      upcomingMoments,
    ),
  };
}
