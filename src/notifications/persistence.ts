import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { loadOnboardingState } from '@/src/onboarding/persistence';
import {
  FRESH_NOTIFICATION_PREFERENCES,
  LEGACY_NOTIFICATION_PREFERENCES,
  sanitizeNotificationPreferences,
  type NotificationPreferences,
} from '@/src/notifications/core';

const NOTIFICATION_PREFERENCES_KEY = 'notification-preferences';

function fallbackPreferences() {
  return loadOnboardingState().source === 'legacy'
    ? LEGACY_NOTIFICATION_PREFERENCES
    : FRESH_NOTIFICATION_PREFERENCES;
}

export function loadNotificationPreferences(): NotificationPreferences {
  const fallback = fallbackPreferences();
  return sanitizeNotificationPreferences(
    sqliteStateStore.read<unknown>(NOTIFICATION_PREFERENCES_KEY),
    fallback,
  );
}

export function saveNotificationPreferences(
  preferences: NotificationPreferences,
): NotificationPreferences {
  const sanitized = sanitizeNotificationPreferences(preferences, fallbackPreferences());
  sqliteStateStore.write(NOTIFICATION_PREFERENCES_KEY, sanitized);
  return sanitized;
}

/**
 * Remember an explicit response to the one-time Android special-access
 * explanation. This is not the OS permission itself; always query AlarmManager.
 */
const EXACT_ALARM_OFFER_SEEN_KEY = 'notification-exact-alarm-offer-v1';

export function hasSeenExactAlarmPermissionOffer(): boolean {
  return sqliteStateStore.read<boolean>(EXACT_ALARM_OFFER_SEEN_KEY) === true;
}

export function markExactAlarmPermissionOfferSeen(): void {
  sqliteStateStore.write(EXACT_ALARM_OFFER_SEEN_KEY, true);
}
