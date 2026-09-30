import { getRestView } from '../src/application/useCases/getRestView';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';
import {
  contextualNapSuggestion,
  type RestWindow,
} from '../src/domain/services/restPlanning';

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

const futureRestWindow: RestWindow = {
  nextStart: new Date(2026, 8, 11, 14, 0),
  wakeAt: new Date(2026, 8, 11, 11, 0),
  sleepAt: new Date(2026, 8, 11, 3, 0),
  windDownAt: new Date(2026, 8, 11, 2, 15),
  shift: { day: 4, start: '14:00', end: '22:00', type: 'afternoon', breakMinutes: 30 },
};

const tiredNap = contextualNapSuggestion(
  { ...defaultDayState, energy: 'cansado' },
  futureRestWindow,
  new Date(2026, 8, 10, 14, 0),
);
if (!tiredNap) throw new Error('energía cansada con margen debería permitir pausa opcional');
equal(tiredNap.durationMin, 20, 'cansado usa pausa corta');
equal(tiredNap.startAt.getHours(), 14, 'pausa parte dentro de un margen breve');
equal(tiredNap.startAt.getMinutes(), 15, 'pausa no empieza de inmediato');

const exhaustedNap = contextualNapSuggestion(
  { ...defaultDayState, energy: 'agotado' },
  futureRestWindow,
  new Date(2026, 8, 10, 14, 0),
);
if (!exhaustedNap) throw new Error('energía agotada con margen debería permitir pausa opcional');
equal(exhaustedNap.durationMin, 30, 'agotado usa pausa de 30 min');

const normalEnergyNap = contextualNapSuggestion(
  defaultDayState,
  futureRestWindow,
  new Date(2026, 8, 10, 14, 0),
);
equal(normalEnergyNap, null, 'energía normal no inventa siesta');

const nearMainSleep = contextualNapSuggestion(
  { ...defaultDayState, energy: 'agotado' },
  futureRestWindow,
  new Date(2026, 8, 11, 1, 30),
);
equal(nearMainSleep, null, 'no compite con sueño principal cercano');

const duringMainSleep = contextualNapSuggestion(
  { ...defaultDayState, energy: 'agotado' },
  futureRestWindow,
  new Date(2026, 8, 11, 5, 0),
);
equal(duringMainSleep, null, 'no reemplaza ventana principal de sueño con siesta corta');

console.log('✓ Rest calcula salida, regreso, recuperación nocturna y pausas contextuales sin contradicciones');
