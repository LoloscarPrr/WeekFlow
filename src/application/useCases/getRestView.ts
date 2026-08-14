import { buildBrainPlan } from '@/src/brain/engine';
import type { DayState } from '@/src/domain/entities/DailyState';
import type { BrainSnapshot } from '@/src/domain/entities/Planning';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import {
  isNightShift,
  nextWorkingShift,
  shiftContextForDate,
} from '@/src/domain/services/shiftSchedule';

export type RestTimelineRow = {
  time: string;
  icon: string;
  title: string;
  copy: string;
};

export type RestPlanContent = {
  windDownAt: string;
  sleepAt: string;
  wakeAt: string;
  nextStart: string;
};

export type RestContent =
  | { kind: 'timeline'; sectionTitle: string; rows: RestTimelineRow[] }
  | { kind: 'plan'; sectionTitle: string; plan: RestPlanContent }
  | { kind: 'empty'; sectionTitle: string };

export type RestView = {
  heroTitle: string;
  contextTitle: string;
  contextCopy: string;
  contextMeta: string;
  content: RestContent;
};

function formatHm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDayTime(date: Date) {
  const day = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
  return `${day} · ${formatHm(date)}`;
}

function dateForClockNearStart(startAt: Date, clock: string) {
  const [hours, minutes] = clock.split(':').map(Number);
  const date = new Date(startAt);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > startAt.getTime()) date.setDate(date.getDate() - 1);
  return date;
}

function addDateMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getRestView(dayState: DayState, weekState: WeekSchedule, now = new Date()): RestView {
  const context = shiftContextForDate(weekState, now);
  const activeStart = context.startAt ? new Date(context.startAt) : null;
  const activeEnd = context.endAt ? new Date(context.endAt) : null;
  const shiftActive = Boolean(
    activeStart
    && activeEnd
    && now >= activeStart
    && now < activeEnd
    && context.shift.type !== 'off',
  );
  const activeNight = shiftActive && isNightShift(context.shift);

  const lookback = new Date(now.getTime() - 6 * 60 * 60_000);
  const recentCandidate = shiftContextForDate(weekState, lookback);
  const candidateEndAt = recentCandidate.endAt ? new Date(recentCandidate.endAt) : null;
  const minutesSinceCandidateEnd = candidateEndAt
    ? (now.getTime() - candidateEndAt.getTime()) / 60_000
    : null;
  const recentNight = candidateEndAt
    && isNightShift(recentCandidate.shift)
    && minutesSinceCandidateEnd !== null
    && minutesSinceCandidateEnd >= 0
    && minutesSinceCandidateEnd <= 360
    ? { ...recentCandidate, endAtDate: candidateEndAt }
    : null;

  const snapshot: BrainSnapshot = {
    ...dayState.settings,
    shift: context.shift,
    energy: dayState.energy,
  };
  const activePlan = buildBrainPlan(snapshot);
  const activeRecovery = activeNight
    ? (() => {
      const commute = activePlan.moments.find((item) => item.type === 'commute-back');
      const recovery = activePlan.moments.find((item) => item.type === 'recovery');
      const rest = activePlan.moments.find((item) => item.type === 'rest');
      return commute && recovery && rest ? { commute, recovery, rest } : null;
    })()
    : null;

  const recoveryPlan = recentNight
    ? (() => {
      const realExitAt = dayState.actualExitAt ? new Date(dayState.actualExitAt) : null;
      const exitAt = realExitAt && Math.abs(now.getTime() - realExitAt.getTime()) <= 8 * 60 * 60_000
        ? realExitAt
        : recentNight.endAtDate;
      const homeAt = addDateMinutes(exitAt, dayState.settings.commuteBackMin);
      const decompressAt = addDateMinutes(homeAt, dayState.settings.recoveryMin);
      const sleepAt = addDateMinutes(decompressAt, 30);
      return { exitAt, homeAt, decompressAt, sleepAt };
    })()
    : null;

  const nextShift = nextWorkingShift(weekState, now);
  const nextRest = nextShift
    ? (() => {
      const nextStart = new Date(nextShift.startAt);
      const nextSnapshot: BrainSnapshot = {
        ...dayState.settings,
        shift: nextShift.shift,
        energy: dayState.energy,
      };
      const plan = buildBrainPlan(nextSnapshot);
      const wake = plan.moments.find((item) => item.type === 'wake');
      if (!wake) return null;
      const wakeAt = dateForClockNearStart(nextStart, wake.time);
      const sleepAt = addDateMinutes(wakeAt, -8 * 60);
      const windDownAt = addDateMinutes(sleepAt, -45);
      return { nextStart, wakeAt, sleepAt, windDownAt, shift: nextShift.shift };
    })()
    : null;

  let heroTitle = 'Tu descanso se adapta a tu semana.';
  let contextTitle = 'Día abierto';
  let contextCopy = 'No hay una jornada activa que obligue a una hora fija. Rest deja espacio y mira la próxima entrada antes de proponerte un cierre.';
  let contextMeta = 'Sin presión por completar una rutina.';

  if (activeNight && activeRecovery && activeEnd) {
    heroTitle = 'Después de la noche, recuperar va primero.';
    contextTitle = 'Turno nocturno en curso';
    contextCopy = 'No voy a poner productividad detrás de la salida. El orden es regreso, bajar revoluciones y descanso.';
    contextMeta = `Salida ${formatHm(activeEnd)} · regreso aprox. ${activeRecovery.commute.time} · descanso ${activeRecovery.rest.time}`;
  } else if (shiftActive && activeEnd) {
    contextTitle = 'Jornada en curso';
    contextCopy = 'Rest ya reserva el regreso y la descompresión antes de pensar en extras para después del trabajo.';
    contextMeta = `Salida programada · ${formatDayTime(activeEnd)}`;
  } else if (recoveryPlan) {
    heroTitle = 'Ahora toca bajar revoluciones.';
    contextTitle = 'Recuperación post-turno nocturno';
    contextCopy = 'La noche terminó hace poco. WeekFlow protege la llegada y el descanso antes de volver a llenar el día.';
    contextMeta = `Casa aprox. ${formatHm(recoveryPlan.homeAt)} · descanso desde ${formatHm(recoveryPlan.sleepAt)}`;
  } else if (nextRest) {
    const night = isNightShift(nextRest.shift);
    contextTitle = night ? 'Preparar un turno nocturno' : 'Proteger la próxima mañana';
    contextCopy = night
      ? 'La hora de descanso se calcula desde tu entrada nocturna; no usamos una hora universal para acostarte.'
      : 'Calculamos hacia atrás desde la próxima entrada para que el turno no se coma tu descanso.';
    contextMeta = `Próxima entrada · ${formatDayTime(nextRest.nextStart)}`;
  }

  if (activeRecovery && activeEnd) {
    return {
      heroTitle,
      contextTitle,
      contextCopy,
      contextMeta,
      content: {
        kind: 'timeline',
        sectionTitle: 'DESPUÉS DEL TURNO',
        rows: [
          { time: formatHm(activeEnd), icon: '✓', title: 'Salir', copy: 'La salida real puede corregir esta hora con “Ya salí”.' },
          { time: activeRecovery.commute.time, icon: '🚇', title: 'Llegar a casa', copy: `${dayState.settings.commuteBackMin} min de regreso estimado.` },
          { time: activeRecovery.recovery.time, icon: '🌿', title: 'Bajar revoluciones', copy: `${dayState.settings.recoveryMin} min protegidos antes de sumar otra cosa.` },
          { time: activeRecovery.rest.time, icon: '😴', title: 'Dormir / recuperar', copy: 'Después de una noche, Rest gana prioridad sobre lo flexible.' },
        ],
      },
    };
  }

  if (recoveryPlan) {
    return {
      heroTitle,
      contextTitle,
      contextCopy,
      contextMeta,
      content: {
        kind: 'timeline',
        sectionTitle: 'RECUPERACIÓN',
        rows: [
          { time: formatHm(recoveryPlan.exitAt), icon: '✓', title: 'Salida tomada como real', copy: 'Usamos tu salida registrada cuando está disponible.' },
          { time: formatHm(recoveryPlan.homeAt), icon: '🚇', title: 'Regreso', copy: `${dayState.settings.commuteBackMin} min estimados.` },
          { time: formatHm(recoveryPlan.decompressAt), icon: '🌿', title: 'Descompresión', copy: 'Sin tareas obligatorias en este bloque.' },
          { time: formatHm(recoveryPlan.sleepAt), icon: '😴', title: 'Ventana de descanso', copy: 'Orientativa: puedes ajustarla a cómo llegues realmente.' },
        ],
      },
    };
  }

  if (nextRest) {
    return {
      heroTitle,
      contextTitle,
      contextCopy,
      contextMeta,
      content: {
        kind: 'plan',
        sectionTitle: 'PRÓXIMO DESCANSO',
        plan: {
          windDownAt: formatDayTime(nextRest.windDownAt),
          sleepAt: formatHm(nextRest.sleepAt),
          wakeAt: formatHm(nextRest.wakeAt),
          nextStart: formatHm(nextRest.nextStart),
        },
      },
    };
  }

  return {
    heroTitle,
    contextTitle,
    contextCopy,
    contextMeta,
    content: { kind: 'empty', sectionTitle: 'PRÓXIMO DESCANSO' },
  };
}
