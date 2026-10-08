const fs = require('fs');

const screen = fs.readFileSync('app/notifications.tsx', 'utf8');
const assistant = fs.readFileSync('app/assistant.tsx', 'utf8');
const nav = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');
const service = fs.readFileSync('src/services/notifications.ts', 'utf8');
const persistence = fs.readFileSync('src/notifications/persistence.ts', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(assistant.includes("title: 'Notificaciones'"), 'Asistente debe exponer Notificaciones');
ok(assistant.includes("path: '/notifications'"), 'Asistente debe navegar a preferencias');
ok(nav.includes("'/notifications'"), 'BottomNav debe mantener Asistente activo');

ok(screen.includes('Permitir recordatorios de WeekFlow'), 'pantalla necesita master');
ok(screen.includes('Salida al trabajo'), 'pantalla necesita salida');
ok(screen.includes('Momentos importantes'), 'pantalla necesita eventos importantes');
ok(screen.includes("title: 'Rest'"), 'pantalla necesita Rest');
ok(screen.includes('syncLivePlanReminders'), 'cambios deben resincronizar');

ok(service.includes('if (!preferences.enabled)'), 'master apagado debe cortar sync antes de pedir permiso');
ok(service.includes('cancelAllWeekFlowReminders()'), 'master apagado debe cancelar recordatorios');
ok(service.includes('allReminders.filter'), 'sync debe filtrar categorías');
ok(service.indexOf('if (!preferences.enabled)') < service.indexOf('initializeNotifications();'), 'master se evalúa antes del permiso');

ok(persistence.includes("NOTIFICATION_PREFERENCES_KEY = 'notification-preferences'"), 'preferencias usan key/value local');
ok(persistence.includes("loadOnboardingState().source === 'legacy'"), 'defaults distinguen legacy/fresh');

console.log('Notification preferences structure tests passed.');
