import crashlytics from '@react-native-firebase/crashlytics';

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
    crashlytics().log(message);
  } catch {
    // Observability must never break WeekFlow.
  }
}

export function recordNonFatalError(error: unknown, context?: string) {
  try {
    if (context) crashlytics().log(context);
    crashlytics().recordError(asError(error));
  } catch {
    // Crash reporting is best-effort and must not affect product behavior.
  }
}
