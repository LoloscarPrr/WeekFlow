import {
  getCrashlytics,
  log,
  recordError,
} from '@react-native-firebase/crashlytics';

function asError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

export function logDiagnostic(message: string) {
  try {
    log(getCrashlytics(), message);
  } catch {
    // Observability must never break WeekFlow.
  }
}

export function recordNonFatalError(error: unknown, context?: string) {
  try {
    const instance = getCrashlytics();
    if (context) log(instance, context);
    recordError(instance, asError(error));
  } catch {
    // Crash reporting is best-effort and must not affect product behavior.
  }
}
