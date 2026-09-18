import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadWeekState, shiftForDate } from '@/src/state/persistence';

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

function localDateTime(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date();
  result.setFullYear(year, month - 1, day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function reminderTime(eventAt: Date, leadMinutes: number) {
  const proposed = new Date(eventAt.getTime() - leadMinutes * 60_000);
  if (proposed.getTime() > Date.now()) return proposed;
  return eventAt;
}

async function performLivePlanReminderSync(now: Date): Promise<number> {
  const allowed = await initializeNotifications();
  if (!allowed) return 0;

  const week = loadWeekState();
  const reminders: WeekFlowReminder[] = [];
  const shiftHorizon = new Date(now);
  shiftHorizon.setDate(shiftHorizon.getDate() + 14);

  for (let offset = 0; offset <= 14; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const shift = shiftForDate(week, date);
    if (shift.type === 'off' || !shift.start) continue;

    const startsAt = localDateTime(localDateKey(date), shift.start);
    if (startsAt <= now || startsAt > shiftHorizon) continue;

    reminders.push({
      id: `shift-${localDateKey(date)}-${shift.start}`,
      title: 'Tu jornada empieza pronto',
      body: `Entrada ${shift.start} · WeekFlow te avisa con anticipación.`,
      at: reminderTime(startsAt, 30),
      kind: 'departure',
    });
  }

  for (const moment of week.importantMoments) {
    const eventAt = localDateTime(moment.date, moment.time);
    if (eventAt <= now) continue;

    reminders.push({
      id: `important-${moment.id}`,
      title: `⏰ ${moment.title}`,
      body: `Hoy a las ${moment.time} · Recordatorio WeekFlow`,
      at: reminderTime(eventAt, 15),
      kind: 'important',
    });
  }

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
  for (const reminder of reminders.sort((a, b) => a.at.getTime() - b.at.getTime())) {
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
