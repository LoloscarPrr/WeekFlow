import { getRestView } from '../src/application/useCases/getRestView';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

const week: WeekSchedule = {
  ...defaultWeekState,
  shifts: defaultWeekState.shifts.map((shift) => shift.day === 2
    ? { day: 2, start: '20:45', end: '07:30', type: 'night', breakMinutes: 30 }
    : { ...shift }),
};

const view = getRestView(
  defaultDayState,
  week,
  new Date(2026, 8, 10, 4, 10),
);

if (view.content.kind !== 'timeline') {
  throw new Error(`esperaba timeline nocturno, recibí ${view.content.kind}`);
}

equal(view.contextMeta, 'Salida 07:30 · regreso aprox. 08:45 · descanso 09:45', 'resumen de recuperación');
equal(view.content.rows[0].time, '07:30', 'salida');
equal(view.content.rows[1].time, '08:45', 'llegada a casa');
equal(view.content.rows[2].time, '09:15', 'bajar revoluciones');
equal(view.content.rows[3].time, '09:45', 'dormir / recuperar');

console.log('✓ Rest calcula salida, regreso y recuperación nocturna sin contradicciones');
