import type { ImportantMoment, WeekSchedule } from '../entities/Shift';

export type DatedImportantMoment = {
  moment: ImportantMoment;
  at: Date;
};

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

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
  const day = mondayBasedDay(date);
  return week.importantMoments
    .filter((moment) => moment.day === day)
    .map((moment) => ({ moment, at: dateAtTime(date, moment.time) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.moment.title.localeCompare(b.moment.title));
}
