import type { Shift, ShiftType, WeekSchedule, WeekShift } from '../entities/Shift';
import { toMinutes } from './time';

export type ShiftContext = {
  shift: Shift;
  day: number;
  startAt: string | null;
  endAt: string | null;
  overnightCarry: boolean;
  key: string;
};

export type UpcomingShift = {
  shift: Shift;
  day: number;
  startAt: string;
  endAt: string;
  key: string;
};

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function classifyShift(start: string, end: string): ShiftType {
  if (!start || !end) return 'off';
  const startHour = Number(start.split(':')[0]);
  const endHour = Number(end.split(':')[0]);
  if (endHour < startHour || startHour >= 19) return 'night';
  if (startHour < 11) return 'morning';
  if (startHour >= 12 && startHour < 19) return 'afternoon';
  return 'custom';
}

export function shiftDurationMinutes(start: string, end: string) {
  if (!start || !end) return 0;
  let duration = toMinutes(end) - toMinutes(start);
  if (duration < 0) duration += 24 * 60;
  return duration;
}

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

function crossesMidnight(shift: Shift) {
  return shift.type !== 'off'
    && Boolean(shift.start)
    && Boolean(shift.end)
    && toMinutes(shift.end) <= toMinutes(shift.start);
}

function storedShiftForDate(week: WeekSchedule, date: Date): WeekShift {
  const day = mondayBasedDay(date);
  return week.shifts.find((item) => item.day === day) ?? {
    day,
    start: '',
    end: '',
    type: 'off',
  };
}

function dateAtTime(date: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function shiftWindowForDate(week: WeekSchedule, date: Date) {
  const stored = storedShiftForDate(week, date);
  const shift: Shift = { start: stored.start, end: stored.end, type: stored.type };

  if (shift.type === 'off' || !shift.start || !shift.end) {
    return {
      shift,
      day: stored.day,
      startAt: null as Date | null,
      endAt: null as Date | null,
    };
  }

  const startAt = dateAtTime(date, shift.start);
  const endAt = dateAtTime(date, shift.end);
  if (crossesMidnight(shift)) endAt.setDate(endAt.getDate() + 1);
  return { shift, day: stored.day, startAt, endAt };
}

export function shiftContextForDate(week: WeekSchedule, date = new Date()): ShiftContext {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  const previous = shiftWindowForDate(week, previousDate);

  if (
    previous.startAt
    && previous.endAt
    && crossesMidnight(previous.shift)
    && date >= previous.startAt
    && date < previous.endAt
  ) {
    return {
      shift: previous.shift,
      day: previous.day,
      startAt: previous.startAt.toISOString(),
      endAt: previous.endAt.toISOString(),
      overnightCarry: true,
      key: `${localDateKey(previous.startAt)}@${previous.shift.start}`,
    };
  }

  const current = shiftWindowForDate(week, date);
  return {
    shift: current.shift,
    day: current.day,
    startAt: current.startAt?.toISOString() ?? null,
    endAt: current.endAt?.toISOString() ?? null,
    overnightCarry: false,
    key: current.startAt
      ? `${localDateKey(current.startAt)}@${current.shift.start}`
      : `${localDateKey(date)}@off`,
  };
}

export function shiftForDate(week: WeekSchedule, date = new Date()): Shift {
  return shiftContextForDate(week, date).shift;
}

export function nextWorkingShift(week: WeekSchedule, fromDate = new Date()): UpcomingShift | null {
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(fromDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const window = shiftWindowForDate(week, date);

    if (!window.startAt || !window.endAt || window.shift.type === 'off') continue;
    if (window.startAt.getTime() <= fromDate.getTime()) continue;

    return {
      shift: window.shift,
      day: window.day,
      startAt: window.startAt.toISOString(),
      endAt: window.endAt.toISOString(),
      key: `${localDateKey(window.startAt)}@${window.shift.start}`,
    };
  }

  return null;
}
