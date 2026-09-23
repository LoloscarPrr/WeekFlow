import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { buildLivePlanReminders } from '@/src/domain/services/reminderPlan';
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
  const allowed = await initializeNotifications();
  if (!allowed) return 0;

  const reminders: WeekFlowReminder[] = buildLivePlanReminders(
    loadDayState(),
    loadWeekState(),
    now,
  );

  const desiredIds = new Set(reminders.map((reminder) => reminder.id));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => {
        const id = logicalReminderId(notification);
        if (id !== null) return !desiredIds.has(id);
        return reminders.some((reminder) => isLegacyEquivalent(notification, reminder));
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
