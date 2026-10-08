import type { PlannedReminderKind } from '@/src/domain/services/reminderPlan';

export type NotificationPreferences = {
  enabled: boolean;
  departure: boolean;
  important: boolean;
  rest: boolean;
  smartSilence: boolean;
};

export const LEGACY_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  departure: true,
  important: true,
  rest: true,
  smartSilence: true,
};

export const FRESH_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  departure: true,
  important: true,
  rest: true,
  smartSilence: true,
};

export function sanitizeNotificationPreferences(
  value: unknown,
  fallback: NotificationPreferences,
): NotificationPreferences {
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<NotificationPreferences>;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    departure: typeof raw.departure === 'boolean' ? raw.departure : fallback.departure,
    important: typeof raw.important === 'boolean' ? raw.important : fallback.important,
    rest: typeof raw.rest === 'boolean' ? raw.rest : fallback.rest,
    smartSilence: typeof raw.smartSilence === 'boolean' ? raw.smartSilence : fallback.smartSilence,
  };
}

export function isReminderKindEnabled(
  preferences: NotificationPreferences,
  kind: PlannedReminderKind,
) {
  if (!preferences.enabled) return false;
  return preferences[kind];
}

export function enabledReminderKinds(preferences: NotificationPreferences) {
  return (['departure', 'important', 'rest'] as const).filter((kind) =>
    isReminderKindEnabled(preferences, kind),
  );
}
