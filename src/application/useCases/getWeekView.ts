import type { WeekSchedule } from '@/src/domain/entities/Shift';
import { shiftDurationMinutes } from '@/src/domain/services/shiftSchedule';

export type WeekSummary = {
  workDays: number;
  freeDays: number;
  total: string;
};

export function getWeekSummary(week: WeekSchedule): WeekSummary {
  const working = week.shifts.filter((shift) => shift.type !== 'off');
  const totalMinutes = working.reduce(
    (sum, shift) => sum + shiftDurationMinutes(shift.start, shift.end),
    0,
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    workDays: working.length,
    freeDays: 7 - working.length,
    total: `${hours}${minutes ? ` h ${minutes} min` : ' h'}`,
  };
}
