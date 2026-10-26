/**
 * Reconciles Expo's scheduled requests without unnecessarily cancelling and
 * recreating reminders that are already correct.
 *
 * This module intentionally has no Expo/React Native imports so the safety
 * rules can be tested independently from the native notification subsystem.
 */
export type DesiredReminder = {
  id: string;
  title: string;
  body: string;
  at: Date;
  kind?: string;
};

export type ScheduledReminder = {
  identifier: string;
  content: {
    title?: string | null;
    body?: string | null;
    data?: unknown;
  };
  trigger: unknown;
};

export type ReminderReconciliation<T extends DesiredReminder = DesiredReminder> = {
  cancelIds: string[];
  toSchedule: T[];
  retained: number;
};

function reminderData(request: ScheduledReminder): Record<string, unknown> {
  const data = request.content.data;
  return data !== null && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
}

export function logicalReminderId(request: ScheduledReminder): string | null {
  const value = reminderData(request).weekflowReminderId;
  return typeof value === 'string' ? value : null;
}

function notificationDate(request: ScheduledReminder): number | null {
  const trigger = request.trigger;
  if (trigger === null || typeof trigger !== 'object') return null;
  const value = (trigger as { date?: unknown }).date;
  const timestamp = value instanceof Date ? value.getTime()
    : typeof value === 'number' ? value
      : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sameTime(request: ScheduledReminder, reminder: DesiredReminder): boolean {
  const scheduled = notificationDate(request);
  return scheduled !== null
    && Math.abs(scheduled - reminder.at.getTime()) < 1000;
}

function isCurrentEquivalent(request: ScheduledReminder, reminder: DesiredReminder): boolean {
  return sameTime(request, reminder)
    && request.content.title === reminder.title
    && request.content.body === reminder.body
    && reminderData(request).kind === (reminder.kind ?? 'general');
}

export function isLegacyEquivalent(request: ScheduledReminder, reminder: DesiredReminder): boolean {
  if (logicalReminderId(request) !== null || !sameTime(request, reminder)) return false;
  if (request.content.title === reminder.title && request.content.body === reminder.body) return true;
  if (reminder.kind === 'departure' && request.content.title === 'Tu jornada empieza pronto') return true;
  if (reminder.kind === 'important' && request.content.title === 'Momento importante') return true;
  return false;
}

/**
 * One native snapshot in, explicit operations out. Unknown notifications
 * remain untouched; stale logical IDs and recognizable legacy copies go away.
 */
export function reconcileScheduledReminders<T extends DesiredReminder>(
  scheduled: ReadonlyArray<ScheduledReminder>,
  desired: ReadonlyArray<T>,
  legacyCandidates: ReadonlyArray<DesiredReminder> = desired,
): ReminderReconciliation<T> {
  const desiredById = new Map<string, T>();
  for (const reminder of desired) {
    if (!desiredById.has(reminder.id)) desiredById.set(reminder.id, reminder);
  }

  const retainedIds = new Set<string>();
  const cancelIds: string[] = [];
  for (const request of scheduled) {
    const id = logicalReminderId(request);
    if (id !== null) {
      const reminder = desiredById.get(id);
      if (reminder && !retainedIds.has(id) && isCurrentEquivalent(request, reminder)) {
        retainedIds.add(id);
      } else {
        cancelIds.push(request.identifier);
      }
    } else if (legacyCandidates.some((reminder) => isLegacyEquivalent(request, reminder))) {
      cancelIds.push(request.identifier);
    }
  }

  const toSchedule = [...desiredById.values()].filter((reminder) => !retainedIds.has(reminder.id));
  return { cancelIds, toSchedule, retained: retainedIds.size };
}
