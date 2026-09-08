import {
  CRASH_REPORTING_CONSENT_KEY,
  applyCrashReportingConsent,
  readCrashReportingConsent,
  updateCrashReportingConsent,
  type CrashReportingPreferenceStore,
  type CrashReportingRuntime,
} from '../src/privacy/crashReportingPreference';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function sequence(actual: string[], expected: string[], message: string) {
  equal(actual.join(' -> '), expected.join(' -> '), message);
}

function memoryStore(initial?: unknown): CrashReportingPreferenceStore & { value: unknown } {
  return {
    value: initial ?? null,
    read<T>(key: string): T | null {
      equal(key, CRASH_REPORTING_CONSENT_KEY, 'se usa la clave canónica de consentimiento');
      return this.value as T | null;
    },
    write(key: string, value: unknown) {
      equal(key, CRASH_REPORTING_CONSENT_KEY, 'se persiste en la clave canónica');
      this.value = value;
    },
  };
}

function runtime(events: string[]): CrashReportingRuntime {
  return {
    async setCollectionEnabled(enabled) {
      events.push(`collection:${String(enabled)}`);
    },
    async deleteUnsentReports() {
      events.push('delete-unsent');
    },
  };
}

async function main() {
  equal(readCrashReportingConsent(memoryStore()), false, 'sin preferencia los informes quedan apagados');
  equal(readCrashReportingConsent(memoryStore('true')), false, 'un valor malformado falla cerrado');
  equal(readCrashReportingConsent(memoryStore(true)), true, 'sólo el booleano true expresa consentimiento');

  const startupEvents: string[] = [];
  const startupEnabled = await applyCrashReportingConsent(memoryStore(), runtime(startupEvents));
  equal(startupEnabled, false, 'el inicio sin consentimiento mantiene la colección apagada');
  sequence(
    startupEvents,
    ['collection:false', 'delete-unsent'],
    'el inicio apaga la colección y limpia informes pendientes',
  );

  const enableStore = memoryStore();
  const enableEvents: string[] = [];
  const enabled = await updateCrashReportingConsent(enableStore, runtime(enableEvents), true);
  equal(enabled, true, 'activar devuelve el estado persistido');
  equal(enableStore.value, true, 'activar persiste el consentimiento');
  sequence(
    enableEvents,
    ['delete-unsent', 'collection:true'],
    'activar limpia informes anteriores al consentimiento antes de recopilar',
  );

  const disableStore = memoryStore(true);
  const disableEvents: string[] = [];
  const disabled = await updateCrashReportingConsent(disableStore, runtime(disableEvents), false);
  equal(disabled, false, 'desactivar devuelve el estado persistido');
  equal(disableStore.value, false, 'desactivar persiste la revocación');
  sequence(
    disableEvents,
    ['collection:false', 'delete-unsent'],
    'desactivar detiene la colección antes de limpiar informes pendientes',
  );

  console.log('Crash-reporting consent regression tests passed.');
}

void main().catch((error) => {
  throw error;
});
