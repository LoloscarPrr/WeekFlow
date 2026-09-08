import {
  deleteUnsentReports,
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import {
  applyCrashReportingConsent,
  readCrashReportingConsent,
  updateCrashReportingConsent as updatePreference,
  type CrashReportingRuntime,
} from '@/src/privacy/crashReportingPreference';

const runtime: CrashReportingRuntime = {
  async setCollectionEnabled(enabled) {
    await setCrashlyticsCollectionEnabled(getCrashlytics(), enabled);
  },
  async deleteUnsentReports() {
    await deleteUnsentReports(getCrashlytics());
  },
};

export type CrashReportingUpdate = {
  enabled: boolean;
  applied: boolean;
};

export function crashReportingConsentEnabled(): boolean {
  return readCrashReportingConsent(sqliteStateStore);
}

export async function syncCrashReportingConsent(): Promise<CrashReportingUpdate> {
  const enabled = crashReportingConsentEnabled();
  try {
    await applyCrashReportingConsent(sqliteStateStore, runtime);
    return { enabled, applied: true };
  } catch {
    return { enabled, applied: false };
  }
}

export async function setCrashReportingConsent(enabled: boolean): Promise<CrashReportingUpdate> {
  try {
    await updatePreference(sqliteStateStore, runtime, enabled);
    return { enabled, applied: true };
  } catch {
    return {
      enabled: crashReportingConsentEnabled(),
      applied: false,
    };
  }
}
