import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
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
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const DURATIONS = [5, 10, 20, 30] as const;
const BASE_STEPS = [
  { icon: '🧍', title: 'Activar', copy: 'Movilidad suave y respiración para empezar sin apuro.' },
  { icon: '🚶', title: 'Mover', copy: 'Marcha cómoda en el sitio o caminata corta.' },
  { icon: '🪑', title: 'Fortalecer', copy: 'Movimientos controlados usando una silla como apoyo si lo necesitas.' },
  { icon: '🙆', title: 'Soltar', copy: 'Movilidad de hombros, espalda y cadera a ritmo cómodo.' },
  { icon: '🌿', title: 'Cerrar', copy: 'Baja el ritmo y termina con respiración tranquila.' },
];

function stepsForDuration(duration: number) {
  if (duration <= 5) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[4]];
  if (duration <= 10) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[2], BASE_STEPS[4]];
  return BASE_STEPS;
}

function elapsedMs(session: ActiveMoveSession, nowMs: number) {
  const startedMs = Date.parse(session.startedAt);
  const currentPauseMs = session.paused && session.pausedAt
    ? Math.max(0, nowMs - Date.parse(session.pausedAt))
    : 0;
  return Math.max(0, nowMs - startedMs - session.pausedTotalMs - currentPauseMs);
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function recordDuration(record: MoveSessionRecord) {
  if (typeof record.actualSeconds !== 'number') return `${record.plannedMinutes} min`;
  if (record.actualSeconds < 60) return '<1 min real';
  const minutes = Math.floor(record.actualSeconds / 60);
  const seconds = record.actualSeconds % 60;
  return seconds ? `${minutes} min ${seconds} s reales` : `${minutes} min reales`;
}

export default function PillarsScreen() {
  const initialActive = useMemo(() => loadActiveMoveSession(), []);
  const initialHistory = useMemo(() => loadMoveHistory(), []);
  const initialDay = useMemo(() => loadDayState(), []);
  const initialWeek = useMemo(() => loadWeekState(), []);

  const [dayState, setDayState] = useState<PersistedDayState>(initialDay);
  const [weekState, setWeekState] = useState<PersistedWeekState>(initialWeek);
  const [duration, setDuration] = useState<number>(initialActive?.plannedMinutes ?? (initialDay.energy === 'agotado' ? 5 : initialDay.energy === 'cansado' ? 10 : initialDay.energy === 'vigoroso' ? 30 : 20));
  const [activeSession, setActiveSession] = useState<ActiveMoveSession | null>(initialActive);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastRecord, setLastRecord] = useState<MoveSessionRecord | null>(initialHistory[0] ?? null);
  const [clockMs, setClockMs] = useState(Date.now());
  const [extraOpen, setExtraOpen] = useState(false);

  const recommended = dayState.energy === 'agotado' ? 5 : dayState.energy === 'cansado' ? 10 : dayState.energy === 'vigoroso' ? 30 : 20;
  const now = useMemo(() => new Date(clockMs), [clockMs]);
  const todayShift = useMemo(() => shiftForDate(weekState, now), [now, weekState]);
  const sessionDuration = activeSession?.plannedMinutes ?? duration;
  const steps = useMemo(() => stepsForDuration(sessionDuration), [sessionDuration]);
  const doneToday = useMemo(() => Boolean(lastRecord && localDateKey(new Date(lastRecord.finishedAt)) === localDateKey(now)), [lastRecord, now]);

  const refreshMove = useCallback(() => {
    const nextDay = loadDayState();
    const nextWeek = loadWeekState();
    const history = loadMoveHistory();
    const active = loadActiveMoveSession();
    setDayState(nextDay);
    setWeekState(nextWeek);
    setLastRecord(history[0] ?? null);
    setActiveSession(active);
    if (active) setDuration(active.plannedMinutes);
    setClockMs(Date.now());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshMove();
    }, [refreshMove]),
  );

  useEffect(() => {
    if (!activeSession || activeSession.paused) return;
    const timer = setInterval(() => setClockMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const elapsedSeconds = activeSession ? Math.floor(elapsedMs(activeSession, clockMs) / 1000) : 0;
  const plannedSeconds = sessionDuration * 60;
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const timerPercent = plannedSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / plannedSeconds) * 100)) : 0;
  const currentStep = Math.min(activeSession?.step ?? 0, steps.length - 1);

  function startSession() {
    const next: ActiveMoveSession = {
      id: `${Date.now()}`,
      startedAt: new Date().toISOString(),
      plannedMinutes: duration,
      step: 0,
      totalSteps: stepsForDuration(duration).length,
      paused: false,
      pausedAt: null,
      pausedTotalMs: 0,
    };
    saveActiveMoveSession(next);
    setActiveSession(next);
    setFinished(false);
    setFeedback(null);
    setExtraOpen(false);
    setClockMs(Date.now());
  }

  function finishSession(incompleteSteps: boolean) {
    if (!activeSession) return;
    const nowMs = Date.now();
    const actualSeconds = Math.max(0, Math.round(elapsedMs(activeSession, nowMs) / 1000));
    const record: MoveSessionRecord = {
      id: activeSession.id,
      startedAt: activeSession.startedAt,
      finishedAt: new Date(nowMs).toISOString(),
      plannedMinutes: activeSession.plannedMinutes,
      actualSeconds,
      completedSteps: incompleteSteps ? currentStep + 1 : steps.length,
      totalSteps: steps.length,
      endedEarly: incompleteSteps,
      feedback: null,
    };
    saveMoveSession(record);
    clearActiveMoveSession();
    setLastRecord(record);
    setActiveSession(null);
    setFinished(true);
    setFeedback(null);
    setClockMs(nowMs);
  }

  function nextStep() {
    if (!activeSession) return;
    if (currentStep >= steps.length - 1) {
      finishSession(false);
      return;
    }
    const next = { ...activeSession, step: currentStep + 1 };
    saveActiveMoveSession(next);
    setActiveSession(next);
  }

  function togglePause() {
    if (!activeSession) return;
    const nowMs = Date.now();
    let next: ActiveMoveSession;
    if (activeSession.paused) {
      const pausedAtMs = activeSession.pausedAt ? Date.parse(activeSession.pausedAt) : nowMs;
      next = {
        ...activeSession,
        paused: false,
        pausedAt: null,
        pausedTotalMs: activeSession.pausedTotalMs + Math.max(0, nowMs - pausedAtMs),
      };
    } else {
      next = {
        ...activeSession,
        paused: true,
        pausedAt: new Date(nowMs).toISOString(),
      };
    }
    saveActiveMoveSession(next);
    setActiveSession(next);
    setClockMs(nowMs);
  }

  function applyFeedback(value: string) {
    setFeedback(value);
    if (!lastRecord) return;
    const updated = { ...lastRecord, feedback: value };
    saveMoveSession(updated);
    setLastRecord(updated);
  }

  if (activeSession) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.sessionShell}>
          <Brand />
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionEyebrow}>MOVE</Text>
            <Text style={styles.sessionCounter}>Paso {currentStep + 1} de {steps.length}</Text>
          </View>

          <View style={styles.playerCard}>
            <Text style={styles.playerIcon}>{steps[currentStep].icon}</Text>
            <Text style={styles.playerTitle}>{steps[currentStep].title}</Text>
            <Text style={styles.playerCopy}>{steps[currentStep].copy}</Text>

            <View style={styles.timerBlock}>
              <Text style={styles.timerLabel}>{remainingSeconds > 0 ? 'TIEMPO REAL RESTANTE' : 'TIEMPO PLANEADO CUMPLIDO'}</Text>
              <Text style={styles.timerValue}>{formatCountdown(remainingSeconds)}</Text>
              <Text style={styles.elapsedCopy}>{formatCountdown(elapsedSeconds)} transcurridos</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${timerPercent}%` }]} />
            </View>

            <Pressable style={styles.primaryButton} onPress={nextStep} disabled={activeSession.paused}>
              <Text style={styles.primaryButtonText}>{currentStep === steps.length - 1 ? 'Terminar' : 'Siguiente'}</Text>
            </Pressable>

            <View style={styles.sessionActions}>
              <Pressable style={styles.linkButton} onPress={togglePause}>
                <Text style={styles.linkText}>{activeSession.paused ? 'Continuar' : 'Pausar'}</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => finishSession(currentStep < steps.length - 1)}>
                <Text style={styles.linkText}>Terminar sesión</Text>
              </Pressable>
            </View>
            {activeSession.paused ? <Text style={styles.pauseCopy}>En pausa. El temporizador también está detenido.</Text> : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView contentContainerStyle={styles.content} onRefreshData={refreshMove}>
        <Brand />
        <PillarTabs active="move" />
        <Text style={styles.eyebrow}>PILARES · MOVE</Text>
        <Text style={styles.title}>Muévete con el tiempo que tienes.</Text>
        <Text style={styles.copy}>Elige cuánto espacio tienes hoy y WeekFlow te acompaña paso a paso.</Text>

        {doneToday && !finished && !extraOpen && lastRecord ? (
          <View style={styles.doneTodayCard}>
            <Text style={styles.doneTodayIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.doneTodayTitle}>Move ya está hecho por hoy</Text>
              <Text style={styles.doneTodayCopy}>{recordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
            </View>
            <Pressable style={styles.extraButton} onPress={() => setExtraOpen(true)}>
              <Text style={styles.extraButtonText}>Otra sesión</Text>
            </Pressable>
          </View>
        ) : null}

        {!finished && (!doneToday || extraOpen) ? (
          <View style={styles.recommendCard}>
            <View style={styles.recommendTop}>
              <View style={styles.moveIcon}><Text style={styles.moveEmoji}>🏃</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendEyebrow}>{doneToday ? 'OPCIONAL' : 'HOY'}</Text>
                <Text style={styles.recommendTitle}>{recommended} min recomendados</Text>
                <Text style={styles.recommendCopy}>{doneToday ? 'Ya hiciste una sesión. Esta segunda no es una obligación.' : todayShift.type === 'off' ? 'Día libre: puedes elegir con más margen.' : `Turno ${todayShift.start}–${todayShift.end}: mantenemos la sesión razonable.`}</Text>
              </View>
            </View>

            <Text style={styles.smallLabel}>¿Cuánto tiempo tienes?</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((item) => (
                <Pressable key={item} style={[styles.duration, duration === item && styles.durationActive]} onPress={() => setDuration(item)}>
                  <Text style={[styles.durationText, duration === item && styles.durationTextActive]}>{item}</Text>
                  <Text style={[styles.durationUnit, duration === item && styles.durationTextActive]}>min</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.primaryButton} onPress={startSession}>
              <Text style={styles.primaryButtonText}>Empezar sesión</Text>
            </Pressable>
          </View>
        ) : null}

        {finished && lastRecord ? (
          <View style={styles.finishCard}>
            <Text style={styles.finishIcon}>✓</Text>
            <Text style={styles.finishTitle}>{lastRecord.endedEarly ? 'Listo por hoy' : 'Sesión completada'}</Text>
            <Text style={styles.finishSummary}>Hecho · {recordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{feedback ? ` · ${feedback}` : ''}</Text>
            <Text style={styles.finishCopy}>¿Cómo se sintió este nivel?</Text>
            <View style={styles.feedbackWrap}>
              {['Muy fácil', 'Bien', 'Difícil', 'Demasiado'].map((item) => (
                <Pressable key={item} style={[styles.feedbackButton, feedback === item && styles.feedbackActive]} onPress={() => applyFeedback(item)}>
                  <Text style={[styles.feedbackText, feedback === item && styles.feedbackTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.secondaryWide} onPress={() => { setFinished(false); setFeedback(null); setExtraOpen(false); }}>
              <Text style={styles.secondaryButtonText}>Volver a Move</Text>
            </Pressable>
          </View>
        ) : null}

        {!finished && !doneToday && lastRecord ? (
          <View style={styles.lastCard}>
            <Text style={styles.lastLabel}>ÚLTIMA SESIÓN</Text>
            <Text style={styles.lastValue}>Hecho · {recordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
          </View>
        ) : null}
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 96 },
  sessionShell: { flex: 1, padding: 22, paddingBottom: 84 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 40, lineHeight: 45, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  recommendCard: { backgroundColor: '#102A4D', borderWidth: 1, borderColor: '#2A5D99', borderRadius: 26, padding: 18, marginTop: 24 },
  recommendTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  moveIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12345F', borderWidth: 1, borderColor: colors.blue },
  moveEmoji: { fontSize: 28 },
  recommendEyebrow: { color: '#77AFFF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  recommendTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
  recommendCopy: { color: '#B5C5DA', fontSize: 13, lineHeight: 19, marginTop: 5 },
  smallLabel: { color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 20 },
  durationRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  duration: { flex: 1, minHeight: 62, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  durationActive: { backgroundColor: '#163B6A', borderColor: colors.blue },
  durationText: { color: colors.muted, fontWeight: '900', fontSize: 18 },
  durationUnit: { color: colors.muted, fontWeight: '800', fontSize: 10, marginTop: 1 },
  durationTextActive: { color: colors.text },
  primaryButton: { marginTop: 20, backgroundColor: colors.blue, borderRadius: 17, paddingVertical: 16, alignItems: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  sessionHeader: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionEyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 3, fontSize: 13 },
  sessionCounter: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  playerCard: { flex: 1, marginTop: 18, marginBottom: 12, backgroundColor: '#102A4D', borderWidth: 1, borderColor: '#2A5D99', borderRadius: 28, padding: 24, alignItems: 'center', justifyContent: 'center' },
  playerIcon: { fontSize: 68 },
  playerTitle: { color: colors.text, fontWeight: '900', fontSize: 34, marginTop: 16 },
  playerCopy: { color: '#C4D1E2', fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 10 },
  timerBlock: { alignItems: 'center', marginTop: 20 },
  timerLabel: { color: '#77AFFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },
  timerValue: { color: colors.text, fontWeight: '900', fontSize: 34, marginTop: 5 },
  elapsedCopy: { color: '#9FB4CE', fontWeight: '800', fontSize: 11, marginTop: 3 },
  progressTrack: { width: '100%', height: 7, borderRadius: 999, backgroundColor: '#0A1B31', overflow: 'hidden', marginTop: 24 },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: 999 },
  sessionActions: { flexDirection: 'row', gap: 22, marginTop: 16 },
  linkButton: { paddingVertical: 8, paddingHorizontal: 8 },
  linkText: { color: '#9CB7D9', fontSize: 13, fontWeight: '800' },
  pauseCopy: { color: '#AFC0D5', fontSize: 12, marginTop: 8 },
  finishCard: { marginTop: 26, backgroundColor: '#0D261D', borderWidth: 1, borderColor: '#28583D', borderRadius: 26, padding: 22, alignItems: 'center' },
  finishIcon: { color: '#8BE0A8', fontSize: 42, fontWeight: '900' },
  finishTitle: { color: colors.text, fontWeight: '900', fontSize: 24, marginTop: 6 },
  finishSummary: { color: '#8BE0A8', fontSize: 14, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  finishCopy: { color: '#B4CABB', fontSize: 14, marginTop: 16 },
  feedbackWrap: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  feedbackButton: { width: '48%', borderWidth: 1, borderColor: '#315B45', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  feedbackActive: { backgroundColor: '#164D37', borderColor: '#62C98A' },
  feedbackText: { color: '#AFC5B6', fontWeight: '800', fontSize: 12 },
  feedbackTextActive: { color: '#DDF8E7' },
  secondaryWide: { width: '100%', borderWidth: 1, borderColor: '#315B45', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  secondaryButtonText: { color: colors.text, fontWeight: '900', fontSize: 14 },
  lastCard: { marginTop: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 15, backgroundColor: colors.surface },
  lastLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  lastValue: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 6 },
  doneTodayCard: { marginTop: 24, backgroundColor: '#0D261D', borderWidth: 1, borderColor: '#28583D', borderRadius: 22, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  doneTodayIcon: { color: '#8BE0A8', fontSize: 28, fontWeight: '900' },
  doneTodayTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  doneTodayCopy: { color: '#AFC5B6', fontSize: 12, lineHeight: 18, marginTop: 3 },
  extraButton: { borderWidth: 1, borderColor: '#315B45', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
  extraButtonText: { color: '#DDF8E7', fontSize: 11, fontWeight: '900' },
});
