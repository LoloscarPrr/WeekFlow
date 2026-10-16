import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadConfirmedWeeklyPlan } from '@/src/brain/weeklyPlanPersistence';
import { loadHabitsState } from '@/src/habits/persistence';
import { shiftContextForDate } from '@/src/domain/services/shiftSchedule';
import { buildLivePlanReminders } from '@/src/domain/services/reminderPlan';
import { isReminderKindEnabled } from '@/src/notifications/core';
import { loadNotificationPreferences } from '@/src/notifications/persistence';
import {
  buildProtectedRestWindows,
  interruptionDecision,
  type SmartSilenceReminderKind,
} from '@/src/notifications/smartSilence';
import { loadDayState, loadWeekState } from '@/src/state/persistence';

export const WEEKFLOW_NOTIFICATION_CHANNEL = 'weekflow-reminders-v2';

export type WeekFlowReminder = {
  id: string;
  title: string;
  body: string;
  at: Date;
  kind?: 'important' | 'departure' | 'rest' | 'food' | 'move' | 'general';
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function initializeNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WEEKFLOW_NOTIFICATION_CHANNEL, {
      name: 'Recordatorios WeekFlow',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 180, 300],
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function logicalReminderId(notification: Notifications.NotificationRequest) {
  const value = notification.content.data?.weekflowReminderId;
  return typeof value === 'string' ? value : null;
}

function notificationDate(notification: Notifications.NotificationRequest): number | null {
  const trigger = notification.trigger as { date?: number | string | Date } | null;
  if (!trigger?.date) return null;
  const value = new Date(trigger.date).getTime();
  return Number.isFinite(value) ? value : null;
}

function isLegacyEquivalent(notification: Notifications.NotificationRequest, reminder: WeekFlowReminder) {
  if (logicalReminderId(notification) !== null) return false;
  const scheduledAt = notificationDate(notification);
  if (scheduledAt === null || Math.abs(scheduledAt - reminder.at.getTime()) >= 1000) return false;

  if (notification.content.title === reminder.title && notification.content.body === reminder.body) return true;
  if (reminder.kind === 'departure' && notification.content.title === 'Tu jornada empieza pronto') return true;
  if (reminder.kind === 'important' && notification.content.title === 'Momento importante') return true;
  return false;
}

async function cancelEquivalentReminder(reminder: WeekFlowReminder): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter((notification) => {
    const logicalId = logicalReminderId(notification);
    return logicalId === reminder.id || isLegacyEquivalent(notification, reminder);
  });
  await Promise.all(matches.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}

async function scheduleAllowedReminder(reminder: WeekFlowReminder): Promise<string | null> {
  if (reminder.at.getTime() <= Date.now()) return null;

  await cancelEquivalentReminder(reminder);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { weekflowReminderId: reminder.id, kind: reminder.kind ?? 'general' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder.at,
      channelId: Platform.OS === 'android' ? WEEKFLOW_NOTIFICATION_CHANNEL : undefined,
    },
  });
}

export async function scheduleReminder(reminder: WeekFlowReminder): Promise<string | null> {
  const preferences = loadNotificationPreferences();
  if (!preferences.enabled) return null;
  if (
    (reminder.kind === 'departure' || reminder.kind === 'important' || reminder.kind === 'rest')
    && !isReminderKindEnabled(preferences, reminder.kind)
  ) return null;

  const dayState = loadDayState();
  const weekState = loadWeekState();
  const windows = buildProtectedRestWindows(dayState, weekState);
  const decision = interruptionDecision(
    preferences,
    (reminder.kind ?? 'general') as SmartSilenceReminderKind,
    reminder.at,
    windows,
  );
  if (!decision.allowed) return null;

  const allowed = await initializeNotifications();
  if (!allowed) return null;
  return scheduleAllowedReminder(reminder);
}

export async function cancelReminder(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllWeekFlowReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders() {
  return Notifications.getAllScheduledNotificationsAsync();
}

async function performLivePlanReminderSync(now: Date): Promise<number> {
  const preferences = loadNotificationPreferences();
  if (!preferences.enabled) {
    await cancelAllWeekFlowReminders();
    return 0;
  }

  const allowed = await initializeNotifications();
  if (!allowed) return 0;

  const dayState = loadDayState();
  const weekState = loadWeekState();
  const allReminders = buildLivePlanReminders(
    dayState,
    weekState,
    now,
  );
  const confirmed = loadConfirmedWeeklyPlan();
  const habits = loadHabitsState();
  const habitReminders: WeekFlowReminder[] = (confirmed?.slots ?? []).flatMap((slot) => {
    const habit = habits.habits.find(h => h.id === slot.habitId && h.active);
    if (!habit || habits.completions.some(entry => entry.habitId === habit.id && entry.date === slot.date)) return [];
    const [year, month, day] = slot.date.split('-').map(Number);
    const [hour, minute] = slot.start.split(':').map(Number);
    const at = new Date(year, month - 1, day, hour, minute);
    if (at <= now || at.getTime() > now.getTime() + 14 * 86400000) return [];
    // Never alert for a habit while commuting to, or working a shift.
    const context = shiftContextForDate(weekState, at);
    if (context.startAt && context.endAt) {
      const shiftStart = new Date(context.startAt).getTime();
      const shiftEnd = new Date(context.endAt).getTime();
      const leaveAt = shiftStart - (dayState.settings.commuteOutMin + dayState.settings.bufferMin) * 60000;
      if (at.getTime() >= leaveAt && at.getTime() < shiftEnd) return [];
    }
    return [{
      id: 'weekly-habit-' + slot.id,
      title: '🌱 ' + habit.name,
      body: slot.variant === 'mini' ? 'Tu versión mini está programada para ahora.' : 'Tienes un espacio reservado para este hábito.',
      at, kind: 'general' as const,
    }];
  });
  const windows = buildProtectedRestWindows(dayState, weekState, now);
  const reminders = [...allReminders.filter(reminder => isReminderKindEnabled(preferences, reminder.kind)), ...habitReminders]
    .filter(reminder => interruptionDecision(preferences, reminder.kind ?? 'general', reminder.at, windows).allowed);

  const desiredIds = new Set(reminders.map((reminder) => reminder.id));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => {
        const id = logicalReminderId(notification);
        if (id !== null) return !desiredIds.has(id);
        return allReminders.some((reminder) => isLegacyEquivalent(notification, reminder));
      })
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
  );

  let scheduledCount = 0;
  for (const reminder of reminders) {
    const id = await scheduleAllowedReminder(reminder);
    if (id) scheduledCount += 1;
  }
  return scheduledCount;
}

let livePlanSyncQueue: Promise<unknown> = Promise.resolve();

export function syncLivePlanReminders(now = new Date()): Promise<number> {
  const sync = livePlanSyncQueue.then(() => performLivePlanReminderSync(now));
  livePlanSyncQueue = sync.catch(() => undefined);
  return sync;
}
