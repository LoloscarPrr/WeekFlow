import type { DayState } from '../entities/DailyState';
import type { Shift, WeekSchedule } from '../entities/Shift';
import { localDateKey } from './shiftSchedule';
import { restWindowForShift } from './restPlanning';

export type PlannedReminderKind = 'important' | 'departure' | 'rest';

export type PlannedReminder = {
  id: string;
  title: string;
  body: string;
  at: Date;
  kind: PlannedReminderKind;
};

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

function shiftForCalendarDate(week: WeekSchedule, date: Date): Shift {
  const day = mondayBasedDay(date);
  const stored = week.shifts.find((item) => item.day === day);
  if (!stored) return { start: '', end: '', type: 'off' };
  return { start: stored.start, end: stored.end, type: stored.type };
}

function localDateTime(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function hm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function eventReminderAt(eventAt: Date, now: Date, leadMinutes = 15) {
  const proposed = new Date(eventAt.getTime() - leadMinutes * 60_000);
  return proposed > now ? proposed : eventAt;
}

export function buildLivePlanReminders(
  dayState: DayState,
  week: WeekSchedule,
  now = new Date(),
  horizonDays = 14,
): PlannedReminder[] {
  const reminders: PlannedReminder[] = [];
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + horizonDays);

  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    const shift = shiftForCalendarDate(week, date);
    if (shift.type === 'off' || !shift.start) continue;

    const startsAt = localDateTime(localDateKey(date), shift.start);
    if (startsAt <= now || startsAt > horizon) continue;

    const leaveAt = new Date(
      startsAt.getTime() - (dayState.settings.commuteOutMin + dayState.settings.bufferMin) * 60_000,
    );
    if (leaveAt > now) {
      reminders.push({
        id: `shift-${localDateKey(date)}-${shift.start}`,
        title: '🚇 Hora de salir hacia el trabajo',
        body: `Entrada ${shift.start} · ${dayState.settings.commuteOutMin} min de traslado + ${dayState.settings.bufferMin} min de margen.`,
        at: leaveAt,
        kind: 'departure',
      });
    }

    const rest = restWindowForShift(dayState, shift, startsAt);
    if (rest?.windDownAt && rest.windDownAt > now) {
      reminders.push({
        id: `rest-${localDateKey(date)}-${shift.start}`,
        title: '🌙 Empieza a bajar el ritmo',
        body: `Descanso ${hm(rest.sleepAt)} · despertar ${hm(rest.wakeAt)} · entrada ${shift.start}.`,
        at: rest.windDownAt,
        kind: 'rest',
      });
    }
  }

  for (const moment of week.importantMoments) {
    const eventAt = localDateTime(moment.date, moment.time);
    if (eventAt <= now) continue;

    const at = eventReminderAt(eventAt, now, 15);
    reminders.push({
      id: `important-${moment.id}`,
      title: `⏰ ${moment.title}`,
      body: at.getTime() === eventAt.getTime()
        ? `Ahora · ${moment.time} · Momento importante`
        : `En 15 min · ${moment.time} · Momento importante`,
      at,
      kind: 'important',
    });
  }

  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime());
}
