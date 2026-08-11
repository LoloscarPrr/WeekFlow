import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { loadDayState, loadMoveHistory, loadWeekState, saveMoveSession, shiftForDate, type MoveSessionRecord } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const DURATIONS = [5, 10, 20, 30] as const;
const BASE_STEPS = [
  { icon: '🧍', title: 'Activar', copy: 'Movilidad suave y respiración para empezar sin apuro.' },
  { icon: '🚶', title: 'Mover', copy: 'Marcha cómoda en el sitio o caminata corta.' },
  { icon: '🪑', title: 'Fortalecer', copy: 'Movimientos controlados usando una silla como apoyo si lo necesitas.' },
  { icon: '🙆', title: 'Soltar', copy: 'Movilidad de hombros, espalda y cadera a ritmo cómodo.' },
  { icon: '🌿', title: 'Cerrar', copy: 'Baja el ritmo y termina con respiración tranquila.' },
];

export default function PillarsScreen() {
  const dayState = useMemo(() => loadDayState(), []);
  const weekState = useMemo(() => loadWeekState(), []);
  const initialHistory = useMemo(() => loadMoveHistory(), []);
  const todayShift = useMemo(() => shiftForDate(weekState), [weekState]);
  const recommended = dayState.energy === 'agotado' ? 5 : dayState.energy === 'cansado' ? 10 : dayState.energy === 'vigoroso' ? 30 : 20;

  const [duration, setDuration] = useState<number>(recommended);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [lastRecord, setLastRecord] = useState<MoveSessionRecord | null>(initialHistory[0] ?? null);

  const steps = useMemo(() => {
    if (duration <= 5) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[4]];
    if (duration <= 10) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[2], BASE_STEPS[4]];
    return BASE_STEPS;
  }, [duration]);

  const approxStepMinutes = Math.max(1, Math.round(duration / steps.length));
  const remainingMinutes = Math.max(0, approxStepMinutes * (steps.length - step));

  function startSession() {
    setStarted(true);
    setPaused(false);
    setStep(0);
    setFinished(false);
    setFeedback(null);
    setStartedAt(new Date().toISOString());
  }

  function finishSession(endedEarly: boolean) {
    const record: MoveSessionRecord = {
      id: `${Date.now()}`,
      startedAt: startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      plannedMinutes: duration,
      completedSteps: endedEarly ? step + 1 : steps.length,
      totalSteps: steps.length,
      endedEarly,
      feedback: null,
    };
    saveMoveSession(record);
    setLastRecord(record);
    setFinished(true);
    setStarted(false);
    setPaused(false);
  }

  function nextStep() {
    if (step >= steps.length - 1) {
      finishSession(false);
      return;
    }
    setStep((current) => current + 1);
  }

  function applyFeedback(value: string) {
    setFeedback(value);
    if (!lastRecord) return;
    const updated = { ...lastRecord, feedback: value };
    saveMoveSession(updated);
    setLastRecord(updated);
  }

  if (started) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.sessionShell}>
          <Brand />
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionEyebrow}>MOVE</Text>
            <Text style={styles.sessionCounter}>Paso {step + 1} de {steps.length}</Text>
          </View>

          <View style={styles.playerCard}>
            <Text style={styles.playerIcon}>{steps[step].icon}</Text>
            <Text style={styles.playerTitle}>{steps[step].title}</Text>
            <Text style={styles.playerCopy}>{steps[step].copy}</Text>
            <Text style={styles.remaining}>≈ {remainingMinutes} min restantes</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
            </View>

            <Pressable style={styles.primaryButton} onPress={nextStep} disabled={paused}>
              <Text style={styles.primaryButtonText}>{step === steps.length - 1 ? 'Terminar' : 'Siguiente'}</Text>
            </Pressable>

            <View style={styles.sessionActions}>
              <Pressable style={styles.linkButton} onPress={() => setPaused((value) => !value)}>
                <Text style={styles.linkText}>{paused ? 'Continuar' : 'Pausar'}</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => finishSession(true)}>
                <Text style={styles.linkText}>Terminar antes</Text>
              </Pressable>
            </View>
            {paused ? <Text style={styles.pauseCopy}>En pausa. Retómala cuando te acomode.</Text> : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <PillarTabs active="move" />
        <Text style={styles.eyebrow}>PILARES · MOVE</Text>
        <Text style={styles.title}>Muévete con el tiempo que tienes.</Text>
        <Text style={styles.copy}>Elige cuánto espacio tienes hoy y WeekFlow te acompaña paso a paso.</Text>

        {!finished ? (
          <View style={styles.recommendCard}>
            <View style={styles.recommendTop}>
              <View style={styles.moveIcon}><Text style={styles.moveEmoji}>🏃</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendEyebrow}>HOY</Text>
                <Text style={styles.recommendTitle}>{recommended} min recomendados</Text>
                <Text style={styles.recommendCopy}>{todayShift.type === 'off' ? 'Día libre: puedes elegir con más margen.' : `Turno ${todayShift.start}–${todayShift.end}: mantenemos la sesión razonable.`}</Text>
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
            <Text style={styles.finishSummary}>Hecho · {lastRecord.plannedMinutes} min{feedback ? ` · ${feedback}` : ''}</Text>
            <Text style={styles.finishCopy}>¿Cómo se sintió este nivel?</Text>
            <View style={styles.feedbackWrap}>
              {['Muy fácil', 'Bien', 'Difícil', 'Demasiado'].map((item) => (
                <Pressable key={item} style={[styles.feedbackButton, feedback === item && styles.feedbackActive]} onPress={() => applyFeedback(item)}>
                  <Text style={[styles.feedbackText, feedback === item && styles.feedbackTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.secondaryWide} onPress={() => { setFinished(false); setFeedback(null); }}>
              <Text style={styles.secondaryButtonText}>Volver a Move</Text>
            </Pressable>
          </View>
        ) : null}

        {!finished && lastRecord ? (
          <View style={styles.lastCard}>
            <Text style={styles.lastLabel}>ÚLTIMA SESIÓN</Text>
            <Text style={styles.lastValue}>Hecho · {lastRecord.plannedMinutes} min{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 36 },
  sessionShell: { flex: 1, padding: 22 },
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
  remaining: { color: '#77AFFF', fontWeight: '900', fontSize: 13, marginTop: 18 },
  progressTrack: { width: '100%', height: 7, borderRadius: 999, backgroundColor: '#0A1B31', overflow: 'hidden', marginTop: 24 },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: 999 },
  sessionActions: { flexDirection: 'row', gap: 22, marginTop: 16 },
  linkButton: { paddingVertical: 8, paddingHorizontal: 8 },
  linkText: { color: '#9CB7D9', fontSize: 13, fontWeight: '800' },
  pauseCopy: { color: '#AFC0D5', fontSize: 12, marginTop: 8 },
  finishCard: { marginTop: 26, backgroundColor: '#0D261D', borderWidth: 1, borderColor: '#28583D', borderRadius: 26, padding: 22, alignItems: 'center' },
  finishIcon: { color: '#8BE0A8', fontSize: 42, fontWeight: '900' },
  finishTitle: { color: colors.text, fontWeight: '900', fontSize: 24, marginTop: 6 },
  finishSummary: { color: '#8BE0A8', fontSize: 14, fontWeight: '900', marginTop: 8 },
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
});
