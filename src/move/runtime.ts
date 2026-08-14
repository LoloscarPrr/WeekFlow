import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('weekflow.db');
const RUNTIME_KEY = 'move-runtime-v1';
const NOTES_KEY = 'move-feedback-notes-v1';

export type MoveRuntime = {
  sessionId: string;
  routineId: string;
  phase: 'exercise' | 'rest';
  phaseStartedAt: string;
  phasePausedAt: string | null;
  phasePausedTotalMs: number;
  exerciseOverrides: Record<string, string>;
};

function ensureTable() {
  db.execSync(`CREATE TABLE IF NOT EXISTS weekflow_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);`);
}

function read<T>(key: string): T | null {
  ensureTable();
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM weekflow_state WHERE key = ? LIMIT 1;', key);
  if (!row?.value) return null;
  try { return JSON.parse(row.value) as T; } catch { return null; }
}

function write(key: string, value: unknown) {
  ensureTable();
  const now = new Date().toISOString();
  db.runSync(`INSERT INTO weekflow_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`, key, JSON.stringify(value), now);
}

function remove(key: string) { ensureTable(); db.runSync('DELETE FROM weekflow_state WHERE key = ?;', key); }

export function createMoveRuntime(sessionId: string, routineId: string, now = new Date()): MoveRuntime {
  return { sessionId, routineId, phase: 'exercise', phaseStartedAt: now.toISOString(), phasePausedAt: null, phasePausedTotalMs: 0, exerciseOverrides: {} };
}

export function loadMoveRuntime(sessionId?: string | null): MoveRuntime | null {
  const parsed = read<Partial<MoveRuntime>>(RUNTIME_KEY);
  if (!parsed?.sessionId || !parsed.phaseStartedAt) return null;
  if (sessionId && parsed.sessionId !== sessionId) return null;
  return { sessionId: parsed.sessionId, routineId: typeof parsed.routineId === 'string' ? parsed.routineId : '', phase: parsed.phase === 'rest' ? 'rest' : 'exercise', phaseStartedAt: parsed.phaseStartedAt, phasePausedAt: typeof parsed.phasePausedAt === 'string' ? parsed.phasePausedAt : null, phasePausedTotalMs: typeof parsed.phasePausedTotalMs === 'number' ? parsed.phasePausedTotalMs : 0, exerciseOverrides: parsed.exerciseOverrides && typeof parsed.exerciseOverrides === 'object' ? parsed.exerciseOverrides as Record<string, string> : {} };
}

export function saveMoveRuntime(runtime: MoveRuntime) { write(RUNTIME_KEY, runtime); }
export function clearMoveRuntime() { remove(RUNTIME_KEY); }
export function phaseElapsedMs(runtime: MoveRuntime, nowMs: number) { const startedMs = Date.parse(runtime.phaseStartedAt); const currentPause = runtime.phasePausedAt ? Math.max(0, nowMs - Date.parse(runtime.phasePausedAt)) : 0; return Math.max(0, nowMs - startedMs - runtime.phasePausedTotalMs - currentPause); }
export function saveMoveFeedbackNote(sessionId: string, note: string) { const clean = note.trim(); const current = read<Array<{ sessionId: string; note: string; savedAt: string }>>(NOTES_KEY) ?? []; const next = current.filter((item) => item.sessionId !== sessionId); if (clean) next.unshift({ sessionId, note: clean, savedAt: new Date().toISOString() }); write(NOTES_KEY, next.slice(0, 30)); }