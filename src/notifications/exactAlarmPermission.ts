import { requireOptionalNativeModule } from 'expo';
import { Alert, Platform } from 'react-native';
import { loadNotificationPreferences, hasSeenExactAlarmPermissionOffer, markExactAlarmPermissionOfferSeen } from '@/src/notifications/persistence';

export type ExactAlarmPermissionStatus = 'allowed' | 'blocked' | 'unavailable';
export type ExactAlarmSettingsResult = 'exact' | 'app-details' | 'not-needed' | 'unavailable';

type ExactAlarmNativeModule = {
  canScheduleExactAlarmsAsync(): Promise<boolean>;
  openExactAlarmSettingsAsync(): Promise<ExactAlarmSettingsResult>;
};

function nativeExactAlarmModule(): ExactAlarmNativeModule | null {
  if (Platform.OS !== 'android') return null;
  return requireOptionalNativeModule<ExactAlarmNativeModule>('WeekFlowExactAlarms');
}

/** SCHEDULE_EXACT_ALARM is special access, unrelated to POST_NOTIFICATIONS. */
export async function getExactAlarmPermissionStatus(): Promise<ExactAlarmPermissionStatus> {
  const native = nativeExactAlarmModule();
  if (!native) return 'unavailable';
  try {
    return await native.canScheduleExactAlarmsAsync() ? 'allowed' : 'blocked';
  } catch {
    return 'unavailable';
  }
}

/** Opens settings only after an explicit user tap. Never grants access silently. */
export async function openExactAlarmPermissionSettings(): Promise<ExactAlarmSettingsResult> {
  const native = nativeExactAlarmModule();
  if (!native) return 'unavailable';
  try {
    return await native.openExactAlarmSettingsAsync();
  } catch {
    return 'unavailable';
  }
}

let permissionOfferInFlight: Promise<void> | null = null;

/**
 * Show one permission explanation to people who already enabled reminders.
 * Android special access cannot be granted by a regular runtime popup.
 * Only the user's explicit "Abrir permisos" action starts Settings.
 */
export function offerExactAlarmAccessIfNeeded(): Promise<void> {
  if (permissionOfferInFlight) return permissionOfferInFlight;

  const pending = (async () => {
    if (Platform.OS !== 'android'
      || !loadNotificationPreferences().enabled
      || hasSeenExactAlarmPermissionOffer()) return;

    const status = await getExactAlarmPermissionStatus();
    if (status !== 'blocked' || !loadNotificationPreferences().enabled
      || hasSeenExactAlarmPermissionOffer()) return;

    // Mark as offered before rendering. Dismissing Android's alert with Back
    // must not repeatedly interrupt the person on each app launch.
    markExactAlarmPermissionOfferSeen();
    Alert.alert(
      'Permitir alarmas de WeekFlow',
      'Para que los avisos de trabajo y momentos importantes intenten sonar a la hora indicada, Android requiere un permiso especial separado de Notificaciones. ¿Quieres abrirlo ahora?',
      [
        { text: 'Más tarde', style: 'cancel' },
        { text: 'Abrir permisos', onPress: () => { void openExactAlarmPermissionSettings(); } },
      ],
    );
  })();

  permissionOfferInFlight = pending;
  void pending.then(
    () => { if (permissionOfferInFlight === pending) permissionOfferInFlight = null; },
    () => { if (permissionOfferInFlight === pending) permissionOfferInFlight = null; },
  );
  return pending;
}
