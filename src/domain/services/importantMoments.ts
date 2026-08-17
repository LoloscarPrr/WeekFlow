import type { ImportantMoment, WeekSchedule } from '../entities/Shift';
import { localDateKey } from './calendarDate';

export type DatedImportantMoment = {
  moment: ImportantMoment;
  at: Date;
};

function dateAtTime(date: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function importantMomentsForDate(
  week: WeekSchedule,
  date: Date,
): DatedImportantMoment[] {
  const dateKey = localDateKey(date);
  return week.importantMoments
    .filter((moment) => moment.date === dateKey)
    .map((moment) => ({ moment, at: dateAtTime(date, moment.time) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.moment.title.localeCompare(b.moment.title));
}
