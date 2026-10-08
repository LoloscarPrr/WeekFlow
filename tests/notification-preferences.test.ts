import {
  FRESH_NOTIFICATION_PREFERENCES,
  LEGACY_NOTIFICATION_PREFERENCES,
  enabledReminderKinds,
  isReminderKindEnabled,
  sanitizeNotificationPreferences,
} from '../src/notifications/core';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

equal(FRESH_NOTIFICATION_PREFERENCES.enabled, false, 'fresh install parte apagado');
equal(LEGACY_NOTIFICATION_PREFERENCES.enabled, true, 'legacy conserva recordatorios activos');

const partial = sanitizeNotificationPreferences(
  { enabled: true, rest: false },
  FRESH_NOTIFICATION_PREFERENCES,
);
equal(partial.enabled, true, 'sanitiza master');
equal(partial.rest, false, 'sanitiza Rest');
equal(partial.departure, true, 'preserva fallback departure');
equal(partial.important, true, 'preserva fallback important');

equal(isReminderKindEnabled({ ...LEGACY_NOTIFICATION_PREFERENCES, departure: false }, 'departure'), false, 'departure apagado filtra salida');
equal(isReminderKindEnabled({ ...LEGACY_NOTIFICATION_PREFERENCES, rest: false }, 'rest'), false, 'Rest apagado filtra Rest');
equal(isReminderKindEnabled({ ...LEGACY_NOTIFICATION_PREFERENCES, important: false }, 'important'), false, 'important apagado filtra evento');
equal(isReminderKindEnabled({ ...LEGACY_NOTIFICATION_PREFERENCES, enabled: false }, 'departure'), false, 'master apagado domina categorías');

const onlyRest = enabledReminderKinds({
  enabled: true,
  departure: false,
  important: false,
  rest: true,
  smartSilence: true,
});
equal(onlyRest.length, 1, 'solo una categoría activa');
equal(onlyRest[0], 'rest', 'Rest queda activa');

console.log('Notification preferences regression tests passed.');
