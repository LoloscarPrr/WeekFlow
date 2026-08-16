import type { WeekSchedule } from '../../domain/entities/Shift';
import { classifyShift } from '../../domain/services/shiftSchedule';

export type WeekShiftPatch = {
  start?: string;
  end?: string;
  off?: boolean;
};

export function updateWeekShift(
  week: WeekSchedule,
  day: number,
  patch: WeekShiftPatch,
): WeekSchedule {
  return {
    shifts: week.shifts.map((item) => {
      if (item.day !== day) return item;

      if (patch.off) {
        return { ...item, start: '', end: '', type: 'off' as const };
      }

      const start = patch.start !== undefined ? patch.start : item.start;
      const end = patch.end !== undefined ? patch.end : item.end;
      return { ...item, start, end, type: classifyShift(start, end) };
    }),
  };
}

export function setWeekWorkDay(week: WeekSchedule, day: number): WeekSchedule {
  return {
    shifts: week.shifts.map((item) => {
      if (item.day !== day) return item;
      const start = item.start || '09:00';
      const end = item.end || '17:00';
      return { ...item, start, end, type: classifyShift(start, end) };
    }),
  };
}
