import { getAuth } from '@react-native-firebase/auth';
import type { ParsedSchedule } from './scheduleOcr';
import { normalizeVisionSchedule } from './visionContract';

const endpoint = (process.env.EXPO_PUBLIC_WEEKFLOW_VISION_URL ?? '').trim();
export const visionOnlineConfigured = /^https:\/\/[^\s]+$/i.test(endpoint);

function fileType(uri: string) {
  const ext = uri.split('?')[0].toLowerCase();
  if (ext.endsWith('.png')) return { type: 'image/png', name: 'schedule.png' };
  if (ext.endsWith('.webp')) return { type: 'image/webp', name: 'schedule.webp' };
  return { type: 'image/jpeg', name: 'schedule.jpg' };
}

// The bearer is a short-lived Firebase user ID token, NEVER an AI API key.
// Explicitly called by the user-only cloud button; OCR never calls this.
export async function requestVisionSchedule(input: {
  uri: string;
  configuredName: string;
  idToken: string;
  endpoint: string;
  fetcher?: typeof fetch;
}): Promise<ParsedSchedule> {
  if (!/^https:\/\/[^\s]+$/i.test(input.endpoint)) {
    throw new Error('IA visual no está configurada. Puedes leer el horario localmente.');
  }
  if (!input.idToken || !input.uri.trim() || input.configuredName.trim().length < 2) {
    throw new Error('Inicia sesión y selecciona una captura para usar IA visual.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const file = fileType(input.uri);
    const body = new FormData();
    body.append('image', { uri: input.uri, name: file.name, type: file.type } as unknown as Blob);
    body.append('name', input.configuredName.trim());
    const response = await (input.fetcher ?? fetch)(input.endpoint, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + input.idToken, Accept: 'application/json' },
      body, signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Tu sesión no permite usar IA visual. Revisa tu Cuenta WeekFlow.');
      }
      if (response.status === 413) throw new Error('La imagen es muy grande. Prueba con una captura más liviana.');
      if (response.status === 429) throw new Error('Límite de análisis alcanzado. Usa la lectura local.');
      throw new Error('No se pudo analizar con IA. La lectura local sigue disponible.');
    }
    const value: unknown = await response.json();
    const payload = value && typeof value === 'object' && 'payload' in value
      ? (value as { payload: unknown }).payload : value;
    return normalizeVisionSchedule(payload, input.configuredName);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Se agotó el tiempo de IA visual. Usa la lectura local.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function readVisionSchedule(uri: string, configuredName: string) {
  if (!visionOnlineConfigured) {
    throw new Error('IA visual no está habilitada en esta versión. Usa la lectura local.');
  }
  const user = getAuth().currentUser;
  if (!user) throw new Error('Debes iniciar sesión en Cuenta WeekFlow para enviar una captura a IA visual.');
  const idToken = await user.getIdToken();
  return requestVisionSchedule({ uri, configuredName, idToken, endpoint });
}
