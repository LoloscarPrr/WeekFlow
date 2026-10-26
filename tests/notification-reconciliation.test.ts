import {
  reconcileScheduledReminders,
  type DesiredReminder,
  type ScheduledReminder,
} from '../src/notifications/reconciliation';

function ok(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}
function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

const at = new Date('2026-10-28T11:15:00.000Z');
const departure: DesiredReminder = {
  id: 'departure-wed', title: 'Tu jornada empieza pronto', body: 'Sal a las 11:30',
  kind: 'departure', at,
};

function scheduled(
  identifier: string,
  reminder: DesiredReminder,
  overrides: {
    logicalId?: string | null;
    at?: unknown;
    title?: string;
    body?: string;
    kind?: string;
  } = {},
): ScheduledReminder {
  const logicalId = overrides.logicalId === undefined ? reminder.id : overrides.logicalId;
  return {
    identifier,
    content: {
      title: overrides.title ?? reminder.title,
      body: overrides.body ?? reminder.body,
      data: logicalId === null ? {} : {
        weekflowReminderId: logicalId,
        kind: overrides.kind ?? reminder.kind ?? 'general',
      },
    },
    trigger: { type: 'date', date: overrides.at === undefined ? reminder.at.getTime() : overrides.at },
  };
}

// No-op resumes and repeated syncs must not churn the native alarm.
const identical = reconcileScheduledReminders([scheduled('old-1', departure)], [departure]);
equal(identical.retained, 1, 'recordatorio correcto retenido');
equal(identical.cancelIds.length, 0, 'sin cancelaciones');
equal(identical.toSchedule.length, 0, 'sin reprogramaciones');

// Keep at most one logical ID even when the native API already has duplicates.
const duplicates = reconcileScheduledReminders(
  [scheduled('old-1', departure), scheduled('old-2', departure)], [departure],
);
equal(duplicates.retained, 1, 'solo uno retenido');
equal(duplicates.cancelIds.join(','), 'old-2', 'duplicado eliminado');
equal(duplicates.toSchedule.length, 0, 'no generar tercer duplicado');

// Time/content/category changes must replace stale records, not preserve them.
for (const change of [
  { at: Date.parse('2026-10-28T11:16:00.000Z') },
  { title: 'Título antiguo' },
  { body: 'Texto antiguo' },
  { kind: 'important' },
  { at: 'nonsense' },
]) {
  const different = reconcileScheduledReminders([scheduled('stale', departure, change)], [departure]);
  equal(different.cancelIds.join(','), 'stale', 'solicitud obsoleta cancelada');
  equal(different.toSchedule.length, 1, 'solicitud actual programada');
}

// Removing a reminder cancels it, leaving unrelated app notifications intact.
const external: ScheduledReminder = {
  identifier: 'other', content: { title: 'Recordatorio personal', data: {} },
  trigger: { date: at.getTime() },
};
const removed = reconcileScheduledReminders([scheduled('obsolete', departure), external], []);
equal(removed.cancelIds.join(','), 'obsolete', 'reminder eliminado');
equal(removed.toSchedule.length, 0, 'sin reemplazo al quitar un reminder');

// Old releases lacked logical IDs; remove only recognizable equivalents.
const legacy = scheduled('legacy', departure, { logicalId: null, body: 'Texto de versión vieja' });
const migrated = reconcileScheduledReminders([legacy], [departure], [departure]);
equal(migrated.cancelIds.join(','), 'legacy', 'aviso heredado cancelado');
equal(migrated.toSchedule.length, 1, 'aviso actual creado');

// A disabled category has no desired alarms, but its old legacy alarm is removed.
const disabled = reconcileScheduledReminders([legacy], [], [departure]);
equal(disabled.cancelIds.join(','), 'legacy', 'categoría desactivada limpia aviso heredado');
equal(disabled.toSchedule.length, 0, 'categoría desactivada no programa nada');

// An unrelated notification without a logical ID should never be deleted.
const unrelated = reconcileScheduledReminders([external], [departure], [departure]);
equal(unrelated.cancelIds.length, 0, 'no borrar avisos ajenos');
equal(unrelated.toSchedule.length, 1, 'agregar solo aviso pendiente');

// Existing native format can include ISO date strings.
const iso = reconcileScheduledReminders(
  [scheduled('iso', departure, { at: at.toISOString() })], [departure],
);
equal(iso.retained, 1, 'triggers ISO siguen siendo equivalentes');

// A valid duplicate behind an invalid first request should be retained.
const mixed = reconcileScheduledReminders([
  scheduled('outdated', departure, { body: 'Viejo' }),
  scheduled('valid', departure),
], [departure]);
equal(mixed.cancelIds.join(','), 'outdated', 'solo obsoleto eliminado');
equal(mixed.toSchedule.length, 0, 'válido existente se conserva');

ok(true, 'regresiones cubiertas');
console.log('Incremental notification reconciliation tests passed.');
