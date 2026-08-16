import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { TimeEditModal } from '@/src/components/TimeEditModal';
import type { Energy } from '@/src/domain/entities/DailyState';
import { useNowController } from '@/src/presentation/now/useNowController';
import { colors } from '@/src/theme/colors';

const energyOptions: { value: Energy; label: string; icon: string }[] = [
  { value: 'vigoroso', label: 'Vigoroso', icon: '🔋' },
  { value: 'bien', label: 'Bien', icon: '🙂' },
  { value: 'cansado', label: 'Cansado', icon: '😮‍💨' },
  { value: 'agotado', label: 'Agotado', icon: '😴' },
];

function remainingLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min restantes`;
  if (minutes === 0) return `${hours} h restantes`;
  return `${hours} h ${minutes} min restantes`;
}

function energyLabel(energy: Energy) {
  return energyOptions.find((item) => item.value === energy)?.label ?? 'Bien';
}

function deltaLabel(deltaMinutes: number) {
  if (deltaMinutes === 0) return 'a la hora programada';
  const absolute = Math.abs(deltaMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  const duration = hours > 0
    ? `${hours} h${minutes ? ` ${minutes} min` : ''}`
    : `${minutes} min`;
  return `${duration} ${deltaMinutes > 0 ? 'más tarde' : 'antes'}`;
}

export default function NowScreen() {
  const {
    dayState,
    refreshNow,
    updateEnergy,
    markActualExit,
    confirmExitReplan,
    correctActualExitTime,
    todayShift,
    snapshot,
    plan,
    hasActualExit,
    exitImpact,
    needsExitReview,
    phase,
    workProgress,
    upcomingMoments,
    jornadaLabel,
    live,
  } = useNowController();
  const [exitEditorOpen, setExitEditorOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <RefreshableScrollView contentContainerStyle={styles.content} onRefreshData={refreshNow}>
        <View style={styles.top}>
          <Brand />
          <View style={styles.build}><Text style={styles.buildText}>Alpha 0.1.0</Text></View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AHORA</Text>
          <Text style={styles.title}>Tu día, sin ruido<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>WeekFlow mira tu horario y te muestra solo lo que importa en este momento.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.brainIcon}><Text style={styles.emoji}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>WeekFlow Brain</Text>
              <Text style={styles.muted}>{phase === 'working' && !hasActualExit ? 'Tu jornada está en curso. El resto del día se mantiene en espera.' : plan.summary}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={jornadaLabel} label="Hoy" />
            <Stat value={`${snapshot.commuteOutMin}/${snapshot.commuteBackMin}`} label="Ida / vuelta" />
            <Stat value={energyLabel(dayState.energy)} label="Energía" />
          </View>
        </View>

        <Text style={styles.section}>¿CÓMO LLEGAS HOY?</Text>
        <View style={styles.energyGrid}>
          {energyOptions.map((item) => {
            const active = item.value === dayState.energy;
            return (
              <Pressable key={item.value} style={[styles.energyButton, active && styles.energyButtonActive]} onPress={() => updateEnergy(item.value)}>
                <Text style={styles.energyIcon}>{item.icon}</Text>
                <Text style={[styles.energyText, active && styles.energyTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>DÍA VIVO</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveIcon}><Text style={styles.emoji}>{live.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>{live.title}</Text>
              <Text style={styles.liveBlue}>{live.blue}</Text>
            </View>
          </View>
          <Text style={styles.liveCopy}>{live.copy}</Text>

          {phase === 'working' && workProgress && !hasActualExit ? (
            <View style={styles.workProgress}>
              <View style={styles.workProgressMeta}>
                <Text style={styles.workRemaining}>{remainingLabel(workProgress.remaining)}</Text>
                <Text style={styles.workPercent}>{workProgress.percent}%</Text>
              </View>
              <View style={styles.workTrack}>
                <View style={[styles.workFill, { width: `${workProgress.percent}%` }]} />
              </View>
            </View>
          ) : null}

          {(phase === 'working' || phase === 'after') && !hasActualExit ? (
            <Pressable style={styles.exitButton} onPress={markActualExit}>
              <Text style={styles.exitButtonText}>{phase === 'working' ? 'Ya salí' : 'Registrar salida real ahora'}</Text>
            </Pressable>
          ) : null}

          {hasActualExit && needsExitReview && exitImpact ? (
            <View style={styles.exitReview}>
              <Text style={styles.exitReviewTitle}>Este cambio sí mueve tu día</Text>
              <Text style={styles.exitReviewCopy}>
                Saliste {deltaLabel(exitImpact.deltaMinutes)}. Regreso aprox. {exitImpact.homeAt} · recuperación {exitImpact.recoveryAt}.
              </Text>
              <Text style={styles.exitReviewMeta}>
                {exitImpact.flexibleCount} {exitImpact.flexibleCount === 1 ? 'bloque flexible espera' : 'bloques flexibles esperan'} tu confirmación.
              </Text>
              <View style={styles.exitReviewActions}>
                <Pressable style={styles.exitSecondary} onPress={() => setExitEditorOpen(true)}>
                  <Text style={styles.exitSecondaryText}>Corregir hora</Text>
                </Pressable>
                <Pressable style={styles.exitPrimary} onPress={confirmExitReplan}>
                  <Text style={styles.exitPrimaryText}>Aplicar reajuste</Text>
                </Pressable>
              </View>
            </View>
          ) : hasActualExit ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>Salida real registrada · {dayState.actualExit}</Text>
              <Text style={styles.confirmationMuted}>Regreso y recuperación parten de la hora real. Solo se movió lo flexible que correspondía.</Text>
              <Pressable onPress={() => setExitEditorOpen(true)} style={styles.correctButton}>
                <Text style={styles.correctButtonText}>Corregir hora</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {upcomingMoments.length ? upcomingMoments.map((item, index) => {
            const actionable = item.type === 'move';
            return (
              <Pressable
                key={`${item.time}-${item.type}-${index}`}
                style={[styles.timelineRow, index === upcomingMoments.length - 1 && styles.timelineRowLast]}
                onPress={actionable ? () => router.push('/pillars') : undefined}
                disabled={!actionable}
                accessibilityRole={actionable ? 'button' : undefined}
                accessibilityLabel={actionable ? `Abrir ${item.title}` : undefined}
              >
                <Text style={styles.timelineTime}>{item.time}</Text>
                <Text style={styles.timelineIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDetail}>{item.detail}</Text>
                  {actionable ? <Text style={styles.timelineAction}>Abrir Move →</Text> : null}
                </View>
              </Pressable>
            );
          }) : (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyTimelineTitle}>Nada urgente después de esto.</Text>
              <Text style={styles.emptyTimelineCopy}>Dejamos el espacio libre en vez de llenarlo por llenar.</Text>
            </View>
          )}
        </View>
      </RefreshableScrollView>
      <TimeEditModal
        visible={exitEditorOpen}
        title="¿A qué hora saliste realmente?"
        description="Cambiaré la hora de salida y volveré a calcular el regreso, la recuperación y solo los bloques flexibles que dependan de ella."
        initialTime={dayState.actualExit ?? ''}
        saveLabel="Guardar salida"
        onCancel={() => setExitEditorOpen(false)}
        onSave={(time) => {
          correctActualExitTime(time);
          setExitEditorOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 96 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  build: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buildText: { color: colors.text, fontSize: 14 },
  hero: { marginTop: 34, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 48, lineHeight: 52, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 26, padding: 18 },
  cardHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  brainIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#2D75D8', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.surface2, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 12, minHeight: 86 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 7 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  energyGrid: { flexDirection: 'row', gap: 8 },
  energyButton: { flex: 1, minHeight: 92, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 8 },
  energyButtonActive: { borderColor: colors.blue, backgroundColor: '#12315A' },
  energyIcon: { fontSize: 26 },
  energyText: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 7 },
  energyTextActive: { color: colors.text },
  liveCard: { backgroundColor: '#102A4D', borderRadius: 26, borderWidth: 1, borderColor: '#2A5D99', padding: 18 },
  liveRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  liveIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  liveTitle: { color: colors.text, fontWeight: '900', fontSize: 22, lineHeight: 27 },
  liveBlue: { color: '#5CA0FF', fontWeight: '900', fontSize: 15, marginTop: 5 },
  liveCopy: { color: '#C2D0E3', fontSize: 15, lineHeight: 22, marginTop: 16 },
  workProgress: { marginTop: 16 },
  workProgressMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workRemaining: { color: '#DCE8F8', fontSize: 13, fontWeight: '900' },
  workPercent: { color: '#79B6FF', fontSize: 12, fontWeight: '900' },
  workTrack: { height: 7, marginTop: 9, borderRadius: 999, backgroundColor: '#081A31', overflow: 'hidden' },
  workFill: { height: '100%', borderRadius: 999, backgroundColor: colors.blue },
  exitButton: { marginTop: 16, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  exitButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  exitReview: { marginTop: 16, backgroundColor: '#352A14', borderWidth: 1, borderColor: '#80662D', borderRadius: 18, padding: 14 },
  exitReviewTitle: { color: '#F6D78A', fontWeight: '900', fontSize: 15 },
  exitReviewCopy: { color: '#E7D7B3', fontSize: 12, lineHeight: 18, marginTop: 6 },
  exitReviewMeta: { color: '#D3B66F', fontSize: 11, fontWeight: '800', marginTop: 7 },
  exitReviewActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  exitSecondary: { flex: 1, borderWidth: 1, borderColor: '#80662D', borderRadius: 13, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  exitSecondaryText: { color: '#E7D7B3', fontSize: 12, fontWeight: '900' },
  exitPrimary: { flex: 1, backgroundColor: colors.blue, borderRadius: 13, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  exitPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  confirmation: { marginTop: 16, backgroundColor: '#0F4039', borderWidth: 1, borderColor: '#2C7569', borderRadius: 18, padding: 14 },
  confirmationText: { color: '#97E7D4', fontWeight: '900', fontSize: 14 },
  confirmationMuted: { color: '#A6C8C0', fontSize: 12, lineHeight: 18, marginTop: 5 },
  correctButton: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 5 },
  correctButtonText: { color: '#8FD8C8', fontSize: 11, fontWeight: '900' },
  timelineCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  timelineRowLast: { borderBottomWidth: 0 },
  timelineTime: { color: '#6EA8FF', fontSize: 13, fontWeight: '900', width: 48 },
  timelineIcon: { fontSize: 18, width: 24 },
  timelineTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  timelineDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  timelineAction: { color: '#76AFFF', fontSize: 11, fontWeight: '900', marginTop: 7 },
  emptyTimeline: { paddingVertical: 18 },
  emptyTimelineTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  emptyTimelineCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
