import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
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

export function createMoveRuntime(sessionId: string, routineId: string, now = new Date()): MoveRuntime {
  return { sessionId, routineId, phase: 'exercise', phaseStartedAt: now.toISOString(), phasePausedAt: null, phasePausedTotalMs: 0, exerciseOverrides: {} };
}

export function loadMoveRuntime(sessionId?: string | null): MoveRuntime | null {
  const parsed = sqliteStateStore.read<Partial<MoveRuntime>>(RUNTIME_KEY);
  if (!parsed?.sessionId || !parsed.phaseStartedAt) return null;
  if (sessionId && parsed.sessionId !== sessionId) return null;
  return { sessionId: parsed.sessionId, routineId: typeof parsed.routineId === 'string' ? parsed.routineId : '', phase: parsed.phase === 'rest' ? 'rest' : 'exercise', phaseStartedAt: parsed.phaseStartedAt, phasePausedAt: typeof parsed.phasePausedAt === 'string' ? parsed.phasePausedAt : null, phasePausedTotalMs: typeof parsed.phasePausedTotalMs === 'number' ? parsed.phasePausedTotalMs : 0, exerciseOverrides: parsed.exerciseOverrides && typeof parsed.exerciseOverrides === 'object' ? parsed.exerciseOverrides as Record<string, string> : {} };
}

export function saveMoveRuntime(runtime: MoveRuntime) { sqliteStateStore.write(RUNTIME_KEY, runtime); }
export function clearMoveRuntime() { sqliteStateStore.delete(RUNTIME_KEY); }
export function phaseElapsedMs(runtime: MoveRuntime, nowMs: number) { const startedMs = Date.parse(runtime.phaseStartedAt); const currentPause = runtime.phasePausedAt ? Math.max(0, nowMs - Date.parse(runtime.phasePausedAt)) : 0; return Math.max(0, nowMs - startedMs - runtime.phasePausedTotalMs - currentPause); }
export function saveMoveFeedbackNote(sessionId: string, note: string) { const clean = note.trim(); const current = sqliteStateStore.read<Array<{ sessionId: string; note: string; savedAt: string }>>(NOTES_KEY) ?? []; const next = current.filter((item) => item.sessionId !== sessionId); if (clean) next.unshift({ sessionId, note: clean, savedAt: new Date().toISOString() }); sqliteStateStore.write(NOTES_KEY, next.slice(0, 30)); }