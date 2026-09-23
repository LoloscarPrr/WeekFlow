import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';
import { buildLivePlanReminders } from '../src/domain/services/reminderPlan';
import { restWindowForShift } from '../src/domain/services/restPlanning';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function hm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function weekWithWednesdayShift(): WeekSchedule {
  return {
    ...defaultWeekState,
    shifts: defaultWeekState.shifts.map((shift) => shift.day === 2
      ? { ...shift, start: '13:00', end: '22:00', type: 'afternoon' as const }
      : { ...shift }),
  };
}

const now = new Date(2026, 8, 22, 20, 0);
const week = weekWithWednesdayShift();
const reminders = buildLivePlanReminders(defaultDayState, week, now);

const departure = reminders.find((item) => item.kind === 'departure');
ok(departure, 'debe existir recordatorio de salida');
equal(hm(departure!.at), '11:30', '13:00 - 75 min - 15 min');
ok(departure!.body.includes('Entrada 13:00'), 'salida explica entrada');
ok(departure!.body.includes('75 min de traslado'), 'salida explica traslado');
ok(departure!.body.includes('15 min de margen'), 'salida explica margen');

const rest = reminders.find((item) => item.kind === 'rest');
ok(rest, 'debe existir recordatorio Rest');
equal(hm(rest!.at), '01:25', 'cierre orientativo');
ok(rest!.body.includes('Descanso 02:10'), 'Rest explica descanso');
ok(rest!.body.includes('despertar 10:10'), 'Rest explica despertar');
ok(rest!.body.includes('entrada 13:00'), 'Rest explica entrada');

const window = restWindowForShift(
  defaultDayState,
  { start: '13:00', end: '22:00', type: 'afternoon' },
  new Date(2026, 8, 23, 13, 0),
);
ok(window, 'ventana Rest calculable');
equal(hm(window!.windDownAt), hm(rest!.at), 'notificación Rest comparte cálculo con Rest');
equal(hm(window!.sleepAt), '02:10', 'hora de descanso de la UI');
equal(hm(window!.wakeAt), '10:10', 'hora de despertar de la UI');

const eventWeek: WeekSchedule = {
  ...week,
  importantMoments: [
    { id: 'pelo', date: '2026-09-25', day: 4, time: '13:30', title: 'Cortarme el pelo' },
  ],
};

const eventReminders = buildLivePlanReminders(
  defaultDayState,
  eventWeek,
  new Date(2026, 8, 25, 12, 0),
);
const important = eventReminders.find((item) => item.id === 'important-pelo');
ok(important, 'evento importante crea recordatorio');
equal(hm(important!.at), '13:15', 'evento avisa 15 min antes');
ok(important!.title.includes('Cortarme el pelo'), 'título conserva evento');

const lateEvent = buildLivePlanReminders(
  defaultDayState,
  eventWeek,
  new Date(2026, 8, 25, 13, 20),
).find((item) => item.id === 'important-pelo');
ok(lateEvent, 'evento tardío conserva recordatorio');
equal(hm(lateEvent!.at), '13:30', 'si faltan menos de 15 min avisa a la hora del evento');

const ids = reminders.map((item) => item.id);
equal(new Set(ids).size, ids.length, 'plan puro no genera IDs duplicados');

console.log('WeekFlow live reminder plan regression tests passed.');
