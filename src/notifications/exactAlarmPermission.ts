import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

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
