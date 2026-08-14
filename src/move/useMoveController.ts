import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  clearActiveMoveSession,
  loadActiveMoveSession,
  loadDayState,
  loadMoveHistory,
  loadWeekState,
  localDateKey,
  saveActiveMoveSession,
  saveMoveSession,
  shiftForDate,
  type ActiveMoveSession,
  type MoveSessionRecord,
  type PersistedDayState,
} from '@/src/state/persistence';
import { alternateExercise, exerciseById, previewForDuration, routineForDuration } from '@/src/move/library';
import {
  clearMoveRuntime,
  createMoveRuntime,
  loadMoveRuntime,
  phaseElapsedMs,
  saveMoveFeedbackNote,
  saveMoveRuntime,
  type MoveRuntime,
} from '@/src/move/runtime';

export const MOVE_DURATIONS = [5, 10, 20, 30] as const;
export const MOVE_FEEDBACK = ['Muy fácil', 'Bien', 'Difícil', 'Demasiado'];

function elapsedMs(session: ActiveMoveSession, nowMs: number) {
  const startedMs = Date.parse(session.startedAt);
  const currentPauseMs = session.paused && session.pausedAt ? Math.max(0, nowMs - Date.parse(session.pausedAt)) : 0;
  return Math.max(0, nowMs - startedMs - session.pausedTotalMs - currentPauseMs);
}

export function formatMoveTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function moveRecordDuration(record: MoveSessionRecord) {
  if (typeof record.actualSeconds !== 'number') return `${record.plannedMinutes} min`;
  if (record.actualSeconds < 60) return '<1 min real';
  const minutes = Math.floor(record.actualSeconds / 60);
  const seconds = record.actualSeconds % 60;
  return seconds ? `${minutes} min ${seconds} s reales` : `${minutes} min reales`;
}

function baseRecommendation(energy: PersistedDayState['energy']) {
  if (energy === 'agotado') return 5;
  if (energy === 'cansado') return 10;
  if (energy === 'vigoroso') return 30;
  return 20;
}

function previousDuration(value: number) {
  if (value >= 30) return 20;
  if (value >= 20) return 10;
  return 5;
}

function recommendationFor(day: PersistedDayState, last: MoveSessionRecord | null) {
  const base = baseRecommendation(day.energy);
  if (last?.feedback === 'Demasiado') return previousDuration(previousDuration(base));
  if (last?.feedback === 'Difícil') return previousDuration(base);
  return base;
}

function resetPhase(runtime: MoveRuntime, phase: MoveRuntime['phase'], nowMs: number): MoveRuntime {
  return { ...runtime, phase, phaseStartedAt: new Date(nowMs).toISOString(), phasePausedAt: null, phasePausedTotalMs: 0 };
}

export function useMoveController() {
  const initialActive = useMemo(() => loadActiveMoveSession(), []);
  const initialHistory = useMemo(() => loadMoveHistory(), []);
  const initialDay = useMemo(() => loadDayState(), []);
  const initialWeek = useMemo(() => loadWeekState(), []);
  const initialRecommended = useMemo(() => recommendationFor(initialDay, initialHistory[0] ?? null), [initialDay, initialHistory]);

  const [dayState, setDayState] = useState(initialDay);
  const [weekState, setWeekState] = useState(initialWeek);
  const [duration, setDuration] = useState<number>(initialActive?.plannedMinutes ?? initialRecommended);
  const [activeSession, setActiveSession] = useState<ActiveMoveSession | null>(initialActive);
  const [runtime, setRuntime] = useState<MoveRuntime | null>(() => loadMoveRuntime(initialActive?.id));
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [lastRecord, setLastRecord] = useState<MoveSessionRecord | null>(initialHistory[0] ?? null);
  const [clockMs, setClockMs] = useState(Date.now());
  const [extraOpen, setExtraOpen] = useState(false);

  const recommended = useMemo(() => recommendationFor(dayState, lastRecord), [dayState, lastRecord]);
  const now = useMemo(() => new Date(clockMs), [clockMs]);
  const todayShift = useMemo(() => shiftForDate(weekState, now), [now, weekState]);
  const sessionDuration = activeSession?.plannedMinutes ?? duration;
  const routine = useMemo(() => routineForDuration(sessionDuration), [sessionDuration]);
  const preview = useMemo(() => previewForDuration(duration), [duration]);
  const doneToday = useMemo(() => Boolean(lastRecord && localDateKey(new Date(lastRecord.finishedAt)) === localDateKey(now)), [lastRecord, now]);
  const currentStepIndex = Math.min(activeSession?.step ?? 0, routine.steps.length - 1);
  const stepDefinition = routine.steps[currentStepIndex];
  const currentExercise = exerciseById(runtime?.exerciseOverrides[String(currentStepIndex)], stepDefinition.exercise);

  const refreshMove = useCallback(() => {
    const nextDay = loadDayState();
    const nextWeek = loadWeekState();
    const history = loadMoveHistory();
    const active = loadActiveMoveSession();
    setDayState(nextDay);
    setWeekState(nextWeek);
    setLastRecord(history[0] ?? null);
    setActiveSession(active);
    setRuntime(loadMoveRuntime(active?.id));
    if (active) setDuration(active.plannedMinutes);
    setClockMs(Date.now());
  }, []);

  useFocusEffect(useCallback(() => { refreshMove(); }, [refreshMove]));

  useEffect(() => {
    if (!activeSession) { if (runtime) setRuntime(null); return; }
    if (runtime?.sessionId === activeSession.id) return;
    const next = createMoveRuntime(activeSession.id, routine.id);
    saveMoveRuntime(next);
    setRuntime(next);
  }, [activeSession, routine.id, runtime]);

  useEffect(() => {
    if (!activeSession || activeSession.paused) return;
    const timer = setInterval(() => setClockMs(Date.now()), 500);
    return () => clearInterval(timer);
  }, [activeSession]);

  const phaseTotalSeconds = runtime?.phase === 'rest' ? stepDefinition.restAfterSec : stepDefinition.durationSec;
  const phaseElapsedSeconds = runtime ? Math.floor(phaseElapsedMs(runtime, clockMs) / 1000) : 0;
  const phaseRemainingSeconds = Math.max(0, phaseTotalSeconds - phaseElapsedSeconds);
  const phasePercent = phaseTotalSeconds > 0 ? Math.min(100, Math.round((phaseElapsedSeconds / phaseTotalSeconds) * 100)) : 100;
  const sessionElapsedSeconds = activeSession ? Math.floor(elapsedMs(activeSession, clockMs) / 1000) : 0;
  const overallPercent = routine.totalSeconds > 0 ? Math.min(100, Math.round((sessionElapsedSeconds / routine.totalSeconds) * 100)) : 0;

  function startSession() {
    const nowMs = Date.now();
    const id = `${nowMs}`;
    const selectedRoutine = routineForDuration(duration);
    const next: ActiveMoveSession = { id, startedAt: new Date(nowMs).toISOString(), plannedMinutes: duration, step: 0, totalSteps: selectedRoutine.steps.length, paused: false, pausedAt: null, pausedTotalMs: 0 };
    const nextRuntime = createMoveRuntime(id, selectedRoutine.id, new Date(nowMs));
    saveActiveMoveSession(next);
    saveMoveRuntime(nextRuntime);
    setActiveSession(next);
    setRuntime(nextRuntime);
    setFinished(false);
    setFeedback(null);
    setFeedbackNote('');
    setNoteSaved(false);
    setExtraOpen(false);
    setClockMs(nowMs);
  }

  function finishSession(forceComplete = false) {
    if (!activeSession) return;
    const nowMs = Date.now();
    const actualSeconds = Math.max(0, Math.round(elapsedMs(activeSession, nowMs) / 1000));
    const completedSteps = forceComplete ? routine.steps.length : runtime?.phase === 'rest' ? currentStepIndex + 1 : currentStepIndex;
    const record: MoveSessionRecord = { id: activeSession.id, startedAt: activeSession.startedAt, finishedAt: new Date(nowMs).toISOString(), plannedMinutes: activeSession.plannedMinutes, actualSeconds, completedSteps, totalSteps: routine.steps.length, endedEarly: completedSteps < routine.steps.length, feedback: null };
    saveMoveSession(record);
    clearActiveMoveSession();
    clearMoveRuntime();
    setLastRecord(record);
    setActiveSession(null);
    setRuntime(null);
    setFinished(true);
    setFeedback(null);
    setFeedbackNote('');
    setNoteSaved(false);
    setClockMs(nowMs);
  }

  function advanceToNextExercise() {
    if (!activeSession || !runtime) return;
    if (currentStepIndex >= routine.steps.length - 1) { finishSession(true); return; }
    const nowMs = Date.now();
    const nextSession = { ...activeSession, step: currentStepIndex + 1 };
    const nextRuntime = resetPhase(runtime, 'exercise', nowMs);
    saveActiveMoveSession(nextSession);
    saveMoveRuntime(nextRuntime);
    setActiveSession(nextSession);
    setRuntime(nextRuntime);
    setClockMs(nowMs);
  }

  function completeCurrentExercise() {
    if (!activeSession || !runtime) return;
    if (currentStepIndex >= routine.steps.length - 1) { finishSession(true); return; }
    if (stepDefinition.restAfterSec > 0) {
      const nowMs = Date.now();
      const nextRuntime = resetPhase(runtime, 'rest', nowMs);
      saveMoveRuntime(nextRuntime);
      setRuntime(nextRuntime);
      setClockMs(nowMs);
      return;
    }
    advanceToNextExercise();
  }

  useEffect(() => {
    if (!activeSession || !runtime || activeSession.paused || phaseRemainingSeconds > 0) return;
    if (runtime.phase === 'rest') advanceToNextExercise(); else completeCurrentExercise();
  }, [activeSession, currentStepIndex, phaseRemainingSeconds, runtime, stepDefinition.restAfterSec]);

  function togglePause() {
    if (!activeSession || !runtime) return;
    const nowMs = Date.now();
    let nextSession: ActiveMoveSession;
    let nextRuntime: MoveRuntime;
    if (activeSession.paused) {
      const pausedAtMs = activeSession.pausedAt ? Date.parse(activeSession.pausedAt) : nowMs;
      const phasePausedAtMs = runtime.phasePausedAt ? Date.parse(runtime.phasePausedAt) : nowMs;
      nextSession = { ...activeSession, paused: false, pausedAt: null, pausedTotalMs: activeSession.pausedTotalMs + Math.max(0, nowMs - pausedAtMs) };
      nextRuntime = { ...runtime, phasePausedAt: null, phasePausedTotalMs: runtime.phasePausedTotalMs + Math.max(0, nowMs - phasePausedAtMs) };
    } else {
      const stamp = new Date(nowMs).toISOString();
      nextSession = { ...activeSession, paused: true, pausedAt: stamp };
      nextRuntime = { ...runtime, phasePausedAt: stamp };
    }
    saveActiveMoveSession(nextSession);
    saveMoveRuntime(nextRuntime);
    setActiveSession(nextSession);
    setRuntime(nextRuntime);
    setClockMs(nowMs);
  }

  function switchExercise() {
    if (!runtime || runtime.phase !== 'exercise') return;
    const nowMs = Date.now();
    const alternative = alternateExercise(currentExercise);
    const nextRuntime = resetPhase({ ...runtime, exerciseOverrides: { ...runtime.exerciseOverrides, [String(currentStepIndex)]: alternative.id } }, 'exercise', nowMs);
    saveMoveRuntime(nextRuntime);
    setRuntime(nextRuntime);
    setClockMs(nowMs);
  }

  function applyFeedback(value: string) {
    setFeedback(value);
    if (!lastRecord) return;
    const updated = { ...lastRecord, feedback: value };
    saveMoveSession(updated);
    setLastRecord(updated);
  }

  function saveNote() {
    if (!lastRecord) return;
    saveMoveFeedbackNote(lastRecord.id, feedbackNote);
    setNoteSaved(true);
  }

  function resetFinished() {
    setFinished(false);
    setFeedback(null);
    setFeedbackNote('');
    setNoteSaved(false);
    setExtraOpen(false);
  }

  return { activeSession, runtime, duration, setDuration, finished, feedback, feedbackNote, setFeedbackNote, noteSaved, setNoteSaved, lastRecord, extraOpen, setExtraOpen, recommended, todayShift, sessionDuration, routine, preview, doneToday, currentStepIndex, stepDefinition, currentExercise, phaseRemainingSeconds, phasePercent, sessionElapsedSeconds, overallPercent, startSession, finishSession, advanceToNextExercise, completeCurrentExercise, togglePause, switchExercise, applyFeedback, saveNote, resetFinished };
}

export type MoveController = ReturnType<typeof useMoveController>;