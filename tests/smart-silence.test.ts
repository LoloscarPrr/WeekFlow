import {
  FRESH_NOTIFICATION_PREFERENCES,
  LEGACY_NOTIFICATION_PREFERENCES,
  sanitizeNotificationPreferences,
} from '../src/notifications/core';
import {
  buildProtectedRestWindows,
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

console.log('Smart silence regression tests passed.');
