import type { ImportantMoment, WeekSchedule } from '../../domain/entities/Shift';
import { classifyShift } from '../../domain/services/shiftSchedule';

export type WeekShiftPatch = {
  start?: string;
  end?: string;
  off?: boolean;
  breakMinutes?: number;
};

function reopenManualWeek(week: WeekSchedule) {
  return {
    ...week,
    organizedAt: null,
    source: 'manual' as const,
  };
}

function validMoment(moment: ImportantMoment) {
  return Boolean(moment.id.trim())
    && Boolean(moment.title.trim())
    && moment.day >= 0
    && moment.day <= 6
    && Number.isInteger(moment.day)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(moment.time);
}

function sortMoments(moments: ImportantMoment[]) {
  return [...moments].sort(
    (a, b) => a.day - b.day || a.time.localeCompare(b.time) || a.title.localeCompare(b.title),
  );
}

export function updateWeekShift(
  week: WeekSchedule,
  day: number,
  patch: WeekShiftPatch,
): WeekSchedule {
  const reopened = reopenManualWeek(week);
  return {
    ...reopened,
    shifts: week.shifts.map((item) => {
      if (item.day !== day) return item;

      if (patch.off) {
        return { ...item, start: '', end: '', breakMinutes: 0, type: 'off' as const };
      }

      const start = patch.start !== undefined ? patch.start : item.start;
      const end = patch.end !== undefined ? patch.end : item.end;
      const nextBreak = patch.breakMinutes !== undefined
        ? Math.max(0, Math.min(180, Math.round(patch.breakMinutes)))
        : item.breakMinutes ?? 0;
      return {
        ...item,
        start,
        end,
        breakMinutes: nextBreak,
        type: classifyShift(start, end),
      };
    }),
  };
}

export function setWeekWorkDay(week: WeekSchedule, day: number): WeekSchedule {
  const reopened = reopenManualWeek(week);
  return {
    ...reopened,
    shifts: week.shifts.map((item) => {
      if (item.day !== day) return item;
      const start = item.start || '09:00';
      const end = item.end || '17:00';
      return {
        ...item,
        start,
        end,
        breakMinutes: item.type === 'off' ? 30 : item.breakMinutes ?? 30,
        type: classifyShift(start, end),
      };
    }),
  };
}

export function upsertImportantMoment(
  week: WeekSchedule,
  moment: ImportantMoment,
): WeekSchedule {
  const normalized: ImportantMoment = {
    ...moment,
    id: moment.id.trim(),
    title: moment.title.trim().slice(0, 80),
  };
  if (!validMoment(normalized)) return week;

  const reopened = reopenManualWeek(week);
  return {
    ...reopened,
    importantMoments: sortMoments([
      ...week.importantMoments.filter((item) => item.id !== normalized.id),
      normalized,
    ]),
  };
}

export function removeImportantMoment(week: WeekSchedule, id: string): WeekSchedule {
  const reopened = reopenManualWeek(week);
  return {
    ...reopened,
    importantMoments: week.importantMoments.filter((item) => item.id !== id),
  };
}

export function completeWeekRitual(week: WeekSchedule, organizedAt: string): WeekSchedule {
  if (!organizedAt || Number.isNaN(new Date(organizedAt).getTime())) return week;
  return { ...week, organizedAt };
}
