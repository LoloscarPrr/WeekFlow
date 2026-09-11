import { getNowView } from '../src/application/useCases/getNowView';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const week: WeekSchedule = {
  ...defaultWeekState,
  shifts: defaultWeekState.shifts.map((shift) => {
    if (shift.day === 3 || shift.day === 4) {
      return { day: shift.day, start: '20:45', end: '07:30', type: 'night', breakMinutes: 30 };
    }
    return { ...shift };
  }),
};

const now = new Date(2026, 8, 11, 7, 56);
const view = getNowView({
  dayState: { ...defaultDayState, energy: 'cansado' },
  weekState: week,
  moveDoneToday: false,
  now,
});

equal(view.phase, 'after', 'fase post-turno');
equal(view.shiftContext.overnightCarry, true, 'mantiene el turno nocturno anterior durante recuperación');
equal(view.live.title, 'Recuperación post-turno', 'Ahora no debe inventar un día libre');

const titles = view.upcomingMoments.map((item) => item.title);
ok(titles.includes('Llegar a casa'), 'debe mostrar llegada a casa');
ok(titles.includes('Bajar revoluciones'), 'debe mostrar recuperación');
ok(titles.includes('Dormir / recuperar'), 'debe proteger descanso');
ok(titles.includes('Jornada de trabajo'), 'debe enlazar con el siguiente turno real');

equal(view.upcomingMoments.find((item) => item.title === 'Llegar a casa')?.time, '08:45', 'hora real de llegada');
equal(view.upcomingMoments.find((item) => item.title === 'Bajar revoluciones')?.time, '09:15', 'hora de descompresión');
equal(view.upcomingMoments.find((item) => item.title === 'Dormir / recuperar')?.time, '09:45', 'hora de descanso');

console.log('✓ Ahora conserva recuperación post-turno y enlaza el siguiente turno');
