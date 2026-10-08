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
