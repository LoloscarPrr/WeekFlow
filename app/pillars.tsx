import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { loadDayState, loadWeekState, shiftForDate } from '@/src/state/persistence';
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
  const todayShift = useMemo(() => shiftForDate(weekState), [weekState]);
  const recommended = dayState.energy === 'agotado' ? 5 : dayState.energy === 'cansado' ? 10 : dayState.energy === 'vigoroso' ? 30 : 20;

  const [duration, setDuration] = useState<number>(recommended);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const steps = useMemo(() => {
    if (duration <= 5) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[4]];
    if (duration <= 10) return [BASE_STEPS[0], BASE_STEPS[1], BASE_STEPS[2], BASE_STEPS[4]];
    return BASE_STEPS;
  }, [duration]);

  function startSession() {
    setStarted(true);
    setPaused(false);
    setStep(0);
    setFinished(false);
    setFeedback(null);
  }

  function nextStep() {
    if (step >= steps.length - 1) {
      setFinished(true);
      setStarted(false);
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>PILARES · MOVE</Text>
        <Text style={styles.title}>Muévete sin pelear con tu semana.</Text>
        <Text style={styles.copy}>WeekFlow adapta la sesión al tiempo y energía que tienes hoy. Puedes parar o cambiar la duración cuando quieras.</Text>

        {!started && !finished ? (
          <>
            <View style={styles.recommendCard}>
              <View style={styles.recommendTop}>
                <View style={styles.moveIcon}><Text style={styles.moveEmoji}>🏃</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recommendEyebrow}>MOVE · HOY</Text>
                  <Text style={styles.recommendTitle}>{recommended} min recomendados</Text>
                  <Text style={styles.recommendCopy}>{todayShift.type === 'off' ? 'Día libre: hay más margen para elegir.' : `Jornada ${todayShift.start}–${todayShift.end}: mantenemos la sesión razonable alrededor del turno.`}</Text>
                </View>
              </View>

              <Text style={styles.smallLabel}>¿Cuánto tiempo quieres usar?</Text>
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

            <Text style={styles.section}>QUÉ HARÁS</Text>
            <View style={styles.previewCard}>
              {steps.map((item, index) => (
                <View key={item.title} style={[styles.previewRow, index === steps.length - 1 && styles.previewRowLast]}>
                  <Text style={styles.previewIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle}>{item.title}</Text>
                    <Text style={styles.previewCopy}>{item.copy}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {started ? (
          <View style={styles.playerCard}>
            <Text style={styles.playerMeta}>PASO {step + 1} DE {steps.length} · {duration} MIN</Text>
            <Text style={styles.playerIcon}>{steps[step].icon}</Text>
            <Text style={styles.playerTitle}>{steps[step].title}</Text>
            <Text style={styles.playerCopy}>{steps[step].copy}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
            </View>

            <View style={styles.playerActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setPaused((value) => !value)}>
                <Text style={styles.secondaryButtonText}>{paused ? 'Continuar' : 'Pausa'}</Text>
              </Pressable>
              <Pressable style={styles.primarySmall} onPress={nextStep} disabled={paused}>
                <Text style={styles.primaryButtonText}>{step === steps.length - 1 ? 'Terminar' : 'Siguiente'}</Text>
              </Pressable>
            </View>
            {paused ? <Text style={styles.pauseCopy}>Sesión en pausa. Retómala cuando quieras.</Text> : null}
          </View>
        ) : null}

        {finished ? (
          <View style={styles.finishCard}>
            <Text style={styles.finishIcon}>✓</Text>
            <Text style={styles.finishTitle}>Sesión completada</Text>
            <Text style={styles.finishCopy}>¿Cómo se sintió este nivel?</Text>
            <View style={styles.feedbackWrap}>
              {['Muy fácil', 'Bien', 'Difícil', 'Demasiado'].map((item) => (
                <Pressable key={item} style={[styles.feedbackButton, feedback === item && styles.feedbackActive]} onPress={() => setFeedback(item)}>
                  <Text style={[styles.feedbackText, feedback === item && styles.feedbackTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.secondaryWide} onPress={() => { setFinished(false); setFeedback(null); }}>
              <Text style={styles.secondaryButtonText}>Volver a Move</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>Después vendrán Food y Rest</Text>
          <Text style={styles.nextCopy}>No los adelantamos todavía: primero queremos que Move sea una experiencia completa y simple.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 36 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30 },
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
  primaryButton: { marginTop: 16, backgroundColor: colors.blue, borderRadius: 17, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 28, marginBottom: 12 },
  previewCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  previewRow: { flexDirection: 'row', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  previewRowLast: { borderBottomWidth: 0 },
  previewIcon: { fontSize: 22, width: 30 },
  previewTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  previewCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  playerCard: { marginTop: 24, backgroundColor: '#102A4D', borderWidth: 1, borderColor: '#2A5D99', borderRadius: 28, padding: 22, alignItems: 'center' },
  playerMeta: { color: '#77AFFF', fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  playerIcon: { fontSize: 54, marginTop: 22 },
  playerTitle: { color: colors.text, fontWeight: '900', fontSize: 30, marginTop: 12 },
  playerCopy: { color: '#C4D1E2', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 8 },
  progressTrack: { width: '100%', height: 7, borderRadius: 999, backgroundColor: '#0A1B31', overflow: 'hidden', marginTop: 24 },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: 999 },
  playerActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: colors.text, fontWeight: '900', fontSize: 14 },
  primarySmall: { flex: 1, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  pauseCopy: { color: '#AFC0D5', fontSize: 12, marginTop: 12 },
  finishCard: { marginTop: 24, backgroundColor: '#0D261D', borderWidth: 1, borderColor: '#28583D', borderRadius: 26, padding: 22, alignItems: 'center' },
  finishIcon: { color: '#8BE0A8', fontSize: 42, fontWeight: '900' },
  finishTitle: { color: colors.text, fontWeight: '900', fontSize: 24, marginTop: 6 },
  finishCopy: { color: '#B4CABB', fontSize: 14, marginTop: 6 },
  feedbackWrap: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  feedbackButton: { width: '48%', borderWidth: 1, borderColor: '#315B45', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  feedbackActive: { backgroundColor: '#164D37', borderColor: '#62C98A' },
  feedbackText: { color: '#AFC5B6', fontWeight: '800', fontSize: 12 },
  feedbackTextActive: { color: '#DDF8E7' },
  secondaryWide: { width: '100%', borderWidth: 1, borderColor: '#315B45', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  nextCard: { marginTop: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 16 },
  nextTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  nextCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
