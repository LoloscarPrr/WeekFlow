import { Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import * as Notifications from 'expo-notifications';
import { initializeNotifications } from '@/src/services/notifications';
import { loadNotificationPreferences } from '@/src/notifications/persistence';

// Explicit diagnostic only. Never transmit agenda data or schedule real remote reminders here.
const ENDPOINT = 'https://fkgccemweaqkdrjozgml.supabase.co/functions/v1/weekflow-push-test';

export async function requestClosedAppPushTest(): Promise<Date> {
  if (Platform.OS !== 'android') throw new Error('Prueba disponible en Android.');
  if (!loadNotificationPreferences().enabled) throw new Error('Activa los recordatorios primero.');
  const user = getAuth().currentUser;
  if (!user || !user.emailVerified) throw new Error('Inicia sesión con tu correo verificado en Cuenta WeekFlow.');
  if (!(await initializeNotifications())) throw new Error('Permite las notificaciones de Android.');
  const device = await Notifications.getDevicePushTokenAsync();
  if (device.type !== 'android' || typeof device.data !== 'string' || !device.data) {
    throw new Error('Firebase no pudo registrar este dispositivo.');
  }
  const idToken = await user.getIdToken();
  if (getAuth().currentUser?.uid !== user.uid || !loadNotificationPreferences().enabled) {
    throw new Error('La sesión o el permiso cambió. Inténtalo nuevamente.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + idToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: device.data }),
      signal: controller.signal,
    });
    if (response.status === 503) throw new Error('El piloto remoto aún no está habilitado en el servidor.');
    if (response.status === 401 || response.status === 403) throw new Error('Tu cuenta no está autorizada para el piloto.');
    if (response.status === 429) throw new Error('Espera antes de solicitar otra prueba.');
    if (response.status !== 202) throw new Error('El servidor no aceptó la prueba.');
    const result = await response.json() as { scheduledAt?: string };
    const at = new Date(result.scheduledAt ?? '');
    if (!Number.isFinite(at.getTime())) throw new Error('Respuesta de prueba inválida.');
    return at;
  } finally {
    clearTimeout(timeout);
  }
}
