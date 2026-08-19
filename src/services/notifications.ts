import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadWeekState, shiftForDate } from '@/src/state/persistence';

export const WEEKFLOW_NOTIFICATION_CHANNEL = 'weekflow-reminders';

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
  }),
});

export async function initializeNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WEEKFLOW_NOTIFICATION_CHANNEL, {
      name: 'Recordatorios WeekFlow',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleAllowedReminder(reminder: WeekFlowReminder): Promise<string | null> {
  if (reminder.at.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: 'default',
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

export async function syncLivePlanReminders(now = new Date()): Promise<number> {
  const allowed = await initializeNotifications();
  if (!allowed) return 0;

  await cancelAllWeekFlowReminders();
  const week = loadWeekState();
  const reminders: WeekFlowReminder[] = [];
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);

  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const shift = shiftForDate(week, date);
    if (shift.type === 'off' || !shift.start) continue;

    const startsAt = localDateTime(localDateKey(date), shift.start);
    if (startsAt <= now || startsAt > horizon) continue;

    reminders.push({
      id: `shift-${localDateKey(date)}-${shift.start}`,
      title: 'Tu jornada empieza pronto',
      body: `Hoy entras a las ${shift.start}. WeekFlow te lo recuerda 30 minutos antes.`,
      at: reminderTime(startsAt, 30),
      kind: 'departure',
    });
  }

  for (const moment of week.importantMoments) {
    const eventAt = localDateTime(moment.date, moment.time);
    if (eventAt <= now || eventAt > horizon) continue;

    reminders.push({
      id: `important-${moment.id}`,
      title: 'Momento importante',
      body: `${moment.title} · ${moment.time}`,
      at: reminderTime(eventAt, 15),
      kind: 'important',
    });
  }

  let scheduled = 0;
  for (const reminder of reminders.sort((a, b) => a.at.getTime() - b.at.getTime())) {
    const id = await scheduleAllowedReminder(reminder);
    if (id) scheduled += 1;
  }
  return scheduled;
}
