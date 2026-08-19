import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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

export async function scheduleReminder(reminder: WeekFlowReminder): Promise<string | null> {
  if (reminder.at.getTime() <= Date.now()) return null;

  const allowed = await initializeNotifications();
  if (!allowed) return null;

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
