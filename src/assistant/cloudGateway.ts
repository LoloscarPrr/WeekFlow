import { getAuth } from '@react-native-firebase/auth';
import {
  normalizeBrainChatResult,
  sanitizeBrainChatHistory,
  type BrainChatContext,
  type BrainChatResult,
  type BrainChatTurn,
} from './cloudContract';

const endpoint = (process.env.EXPO_PUBLIC_WEEKFLOW_BRAIN_URL ?? '').trim();
// Pin the service to this WeekFlow Supabase function to avoid ever forwarding
// a Firebase user token to an unexpected URL from a misconfigured build.
export function isValidBrainEndpoint(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'fkgccemweaqkdrjozgml.supabase.co'
      && url.pathname === '/functions/v1/brain-chat'
      && !url.search && !url.hash && !url.username && !url.password;
  } catch {
    return false;
  }
}
export const brainCloudConfigured = isValidBrainEndpoint(endpoint);

export async function requestBrainChat(input: {
  endpoint: string;
  idToken: string;
  message: string;
  context: BrainChatContext;
  history: BrainChatTurn[];
  fetcher?: typeof fetch;
}): Promise<BrainChatResult> {
  if (!isValidBrainEndpoint(input.endpoint)) throw new Error('El endpoint oficial de IA conversacional no está configurado.');
  const message = input.message.trim();
  if (!input.idToken || !message || message.length > 1000) throw new Error('Inicia sesión y envía un mensaje de hasta 1000 caracteres.');
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 20000);
  try {
    const response = await (input.fetcher ?? fetch)(input.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + input.idToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ message, context: input.context, history: sanitizeBrainChatHistory(input.history) }),
      signal: abort.signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Inicia sesión con un correo verificado en Cuenta WeekFlow.');
      if (response.status === 429) throw new Error('Alcanzaste el límite diario de IA. El asistente local sigue disponible.');
      if (response.status === 503) throw new Error('La IA conversacional todavía no está activada. Usa Interpretar sin conexión.');
      throw new Error('No se pudo consultar a la IA. Puedes seguir usando Interpretar local.');
    }
    const payload: unknown = await response.json();
    return normalizeBrainChatResult(payload);
  } catch (error) {
    if (abort.signal.aborted) throw new Error('La IA demoró demasiado. El asistente local sigue disponible.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function talkToBrainAI(message: string, context: BrainChatContext, history: BrainChatTurn[]) {
  if (!brainCloudConfigured) throw new Error('La IA conversacional no está habilitada en esta versión.');
  const user = getAuth().currentUser;
  if (!user) throw new Error('Inicia sesión en Cuenta WeekFlow para usar IA conversacional.');
  const idToken = await user.getIdToken();
  return requestBrainChat({ endpoint, idToken, message, context, history });
}
