export const CRASH_REPORTING_CONSENT_KEY = 'privacy-crash-reporting-consent-v1';

export type CrashReportingPreferenceStore = {
  read<T>(key: string): T | null;
  write(key: string, value: unknown): void;
};

export type CrashReportingRuntime = {
  setCollectionEnabled(enabled: boolean): Promise<void>;
  deleteUnsentReports(): Promise<void>;
};

export function readCrashReportingConsent(store: CrashReportingPreferenceStore): boolean {
  return store.read<unknown>(CRASH_REPORTING_CONSENT_KEY) === true;
}

export async function applyCrashReportingConsent(
  store: CrashReportingPreferenceStore,
  runtime: CrashReportingRuntime,
): Promise<boolean> {
  const enabled = readCrashReportingConsent(store);

  if (enabled) {
    // Reports captured before consent must not be sent retroactively.
    await runtime.deleteUnsentReports();
    await runtime.setCollectionEnabled(true);
    return true;
  }

  await runtime.setCollectionEnabled(false);
  await runtime.deleteUnsentReports();
  return false;
}

export async function updateCrashReportingConsent(
  store: CrashReportingPreferenceStore,
  runtime: CrashReportingRuntime,
  enabled: boolean,
): Promise<boolean> {
  store.write(CRASH_REPORTING_CONSENT_KEY, enabled);
  return applyCrashReportingConsent(store, runtime);
}
