// Isolated pilot: no agenda, no arbitrary notification content, no automatic sends.
import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'npm:jose@5.9.6';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
const project = 'weekflow-84a82';
const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const env = (key: string) => Deno.env.get(key) ?? '';
const json = (status: number, data: unknown) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

async function authorizedTester(req: Request): Promise<boolean> {
  const bearer = /^Bearer (\S+)$/i.exec(req.headers.get('Authorization') ?? '')?.[1];
  const tester = env('WEEKFLOW_PUSH_TESTER_UID');
  if (!bearer || !tester) return false;
  try {
    const { payload } = await jwtVerify(bearer, jwks, {
      algorithms: ['RS256'], issuer: 'https://securetoken.google.com/' + project, audience: project,
    });
    return payload.sub === tester && payload.email_verified === true;
  } catch { return false; }
}

async function claimTest(): Promise<boolean> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const url = env('SUPABASE_URL');
  if (!key || !url) return false;
  const result = await fetch(url + '/rest/v1/rpc/claim_weekflow_push_test', {
    method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: '{}', signal: AbortSignal.timeout(5000),
  });
  return result.ok && (await result.json()) === true;
}

async function getFcmAccessToken(): Promise<string> {
  const credentials = JSON.parse(env('WEEKFLOW_FCM_SERVICE_ACCOUNT_JSON'));
  if (credentials.project_id !== project || typeof credentials.client_email !== 'string'
    || typeof credentials.private_key !== 'string') throw new Error('Invalid credentials');
  const key = await importPKCS8(credentials.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(credentials.client_email)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('5m').sign(key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('OAuth rejected');
  const result = await response.json();
  if (typeof result.access_token !== 'string') throw new Error('OAuth unavailable');
  return result.access_token;
}

async function sendDelayed(token: string, accessToken: string) {
  try {
    await new Promise(resolve => setTimeout(resolve, 15000));
    const result = await fetch('https://fcm.googleapis.com/v1/projects/' + project + '/messages:send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: {
        token,
        notification: { title: 'WeekFlow · prueba remota', body: 'Este aviso llegó desde el servidor. No modifica tu agenda.' },
        android: { priority: 'HIGH', ttl: '120s', notification: {
          channel_id: 'weekflow-reminders-v2', tag: 'weekflow-remote-diagnostic', sound: 'default',
        }},
        data: { kind: 'diagnostic-remote-push' },
      }}),
      signal: AbortSignal.timeout(10000),
    });
    // Never log the token, user identity, credentials or provider response body.
    console.info('WeekFlow remote diagnostic FCM status', result.status);
  } catch { console.warn('WeekFlow remote diagnostic request failed'); }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (env('ENABLE_WEEKFLOW_PUSH_TEST') !== 'true' || !env('WEEKFLOW_FCM_SERVICE_ACCOUNT_JSON')
    || !env('WEEKFLOW_PUSH_TESTER_UID')) return json(503, { error: 'Pilot disabled' });
  if (!(await authorizedTester(req))) return json(403, { error: 'Not authorized' });
  try {
    if (Number(req.headers.get('content-length') || 0) > 4096) return json(413, { error: 'Too large' });
    const raw = await req.text();
    if (raw.length > 4096) return json(413, { error: 'Too large' });
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return json(400, { error: 'Invalid JSON' }); }
    const data = input as { token?: unknown } | null;
    if (!data || Object.keys(data).length !== 1 || typeof data.token !== 'string'
      || !/^[A-Za-z0-9_:\-]{20,2048}$/.test(data.token)) return json(400, { error: 'Invalid token' });
    if (!(await claimTest())) return json(429, { error: 'Rate limited or unavailable' });
    const accessToken = await getFcmAccessToken();
    const scheduledAt = new Date(Date.now() + 15000).toISOString();
    EdgeRuntime.waitUntil(sendDelayed(data.token, accessToken));
    return json(202, { scheduledAt }); // queued, not provider acceptance or OS delivery
  } catch { return json(503, { error: 'Pilot unavailable' }); }
});
