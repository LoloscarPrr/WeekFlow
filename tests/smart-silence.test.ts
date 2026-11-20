import {
  FRESH_NOTIFICATION_PREFERENCES,
  LEGACY_NOTIFICATION_PREFERENCES,
  sanitizeNotificationPreferences,
} from '../src/notifications/core';
import {
  buildProtectedRestWindows,
  nextProtectedRestWindow,
  interruptionDecision,
  type ProtectedRestWindow,
} from '../src/notifications/smartSilence';
import { defaultDayState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

equal(FRESH_NOTIFICATION_PREFERENCES.smartSilence, true, 'fresh activa protección por defecto');
equal(LEGACY_NOTIFICATION_PREFERENCES.smartSilence, true, 'legacy activa protección por defecto');

const migrated = sanitizeNotificationPreferences(
  { enabled: true, departure: true, important: true, rest: true },
  LEGACY_NOTIFICATION_PREFERENCES,
);
equal(migrated.smartSilence, true, 'preferencia antigua recibe smartSilence');

const window: ProtectedRestWindow = {
  startsAt: new Date('2026-10-08T22:00:00.000Z'),
  endsAt: new Date('2026-10-09T06:00:00.000Z'),
  nextShiftAt: new Date('2026-10-09T08:00:00.000Z'),
};
const inside = new Date('2026-10-09T01:00:00.000Z');
const outside = new Date('2026-10-09T07:00:00.000Z');

for (const kind of ['food', 'move', 'general'] as const) {
  equal(
    interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, kind, inside, [window]).allowed,
    false,
    `${kind} se suprime dentro de descanso`,
  );
}
for (const kind of ['important', 'departure', 'rest'] as const) {
  equal(
    interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, kind, inside, [window]).allowed,
    true,
    `${kind} mantiene prioridad`,
  );
}
equal(
  interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, 'move', outside, [window]).allowed,
  true,
  'fuera de descanso se permite',
);
equal(
  interruptionDecision({ ...LEGACY_NOTIFICATION_PREFERENCES, smartSilence: false }, 'move', inside, [window]).allowed,
  true,
  'protección apagada no suprime',
);

const now = new Date(2026, 9, 8, 8, 0, 0, 0);
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const mondayDay = (tomorrow.getDay() + 6) % 7;
const week: WeekSchedule = {
  shifts: Array.from({ length: 7 }, (_, day) => ({
    day,
    start: day === mondayDay ? '13:00' : '',
    end: day === mondayDay ? '21:00' : '',
    type: day === mondayDay ? 'afternoon' as const : 'off' as const,
    breakMinutes: 0,
  })),
  importantMoments: [],
  organizedAt: null,
  source: 'manual',
};
const windows = buildProtectedRestWindows(defaultDayState, week, now, 2);
ok(windows.length >= 1, 'turno futuro debe producir descanso protegido');
ok(windows[0].startsAt < windows[0].endsAt, 'ventana debe tener inicio antes que fin');

// WF-NOTIFY-010 — date-specific rosters, including the Sunday before Monday.
const monday = new Date(2026, 10, 2, 8, 0, 0, 0);
const sunday = new Date(2026, 10, 1, 8, 0, 0, 0);
const mondayDate = new Date(2026, 10, 2, 0, 0, 0, 0);
const emptyRoster: WeekSchedule = {
  ...week,
  shifts: week.shifts.map(s => ({ ...s, type: 'off' as const, start: '', end: '' })),
};
const previousNight: WeekSchedule = {
  ...emptyRoster,
  shifts: emptyRoster.shifts.map(s => s.day === 6
    ? { ...s, type: 'night' as const, start: '21:00', end: '05:00' } : s),
};
const rosterForDate = (date: Date) => date < mondayDate ? previousNight : emptyRoster;
const afterSundayNight = buildProtectedRestWindows(defaultDayState, emptyRoster, monday, 2, rosterForDate);
const mondayAtNine = new Date(2026, 10, 2, 9, 0, 0, 0);
ok(afterSundayNight.some(w => w.startsAt <= mondayAtNine && mondayAtNine < w.endsAt),
  'domingo nocturno de semana anterior protege recuperación del lunes');
equal(interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, 'move', mondayAtNine, afterSundayNight).allowed,
  false, 'Move queda silenciado durante recuperación real');
equal(interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, 'important', mondayAtNine, afterSundayNight).allowed,
  true, 'importantes siguen siendo excepción explícita');
equal(interruptionDecision(LEGACY_NOTIFICATION_PREFERENCES, 'move', mondayAtNine,
  buildProtectedRestWindows(defaultDayState, emptyRoster, monday, 2, () => emptyRoster)).allowed,
  true, 'sin turno previo real no se inventa descanso');

const nextMondayShift: WeekSchedule = {
  ...emptyRoster,
  shifts: emptyRoster.shifts.map(s => s.day === 0
    ? { ...s, type: 'afternoon' as const, start: '13:00', end: '21:00' } : s),
};
const nextWeekResolver = (date: Date) => date < mondayDate ? emptyRoster : nextMondayShift;
const upcoming = buildProtectedRestWindows(defaultDayState, emptyRoster, sunday, 9, nextWeekResolver);
ok(upcoming.some(w => w.nextShiftAt.getFullYear() === 2026 && w.nextShiftAt.getMonth() === 10
  && w.nextShiftAt.getDate() === 2), 'domingo actual usa jornada real de lunes siguiente');
const withoutPreparedNext = buildProtectedRestWindows(defaultDayState, emptyRoster, sunday, 9,
  () => emptyRoster);
equal(withoutPreparedNext.length, 0,
  'semana futura sin preparar no hereda turnos imaginados desde la actual');
const nextVisible = nextProtectedRestWindow(defaultDayState, emptyRoster, sunday, nextWeekResolver);
ok(nextVisible !== null && nextVisible.nextShiftAt.getDate() === 2,
  'etiqueta de próximo descanso consulta el mismo horario canónico por fecha');
ok(upcoming.every((w, i) => i === 0 || upcoming[i - 1].startsAt <= w.startsAt),
  'ventanas con horarios de distintas semanas mantienen orden cronológico');

console.log('Smart silence regression tests passed.');
