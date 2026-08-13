import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import { assessExitReplanImpact } from '@/src/brain/exitImpact';
import type { BrainSnapshot, Energy, Shift } from '@/src/brain/types';
import {
  loadDayState,
  loadWeekState,
  moveSessionDoneToday,
  saveDayState,
  shiftContextForDate,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const energyOptions: { value: Energy; label: string; icon: string }[] = [
  { value: 'vigoroso', label: 'Vigoroso', icon: '🔋' },
  { value: 'bien', label: 'Bien', icon: '🙂' },
  { value: 'cansado', label: 'Cansado', icon: '😮‍💨' },
  { value: 'agotado', label: 'Agotado', icon: '😴' },
];

type DayPhase = 'off' | 'before' | 'commuting' | 'working' | 'after';

function currentHm(now = new Date()) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesNow(now: Date) {
  return now.getHours() * 60 + now.getMinutes();
}

function phaseForShift(shift: Shift, commuteOutMin: number, bufferMin: number, now: Date): DayPhase {
  if (shift.type === 'off' || !shift.start || !shift.end) return 'off';

  const current = minutesNow(now);
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const overnight = end <= start;
  const working = overnight ? current >= start || current < end : current >= start && current < end;
  if (working) return 'working';

  const untilStart = (start - current + 1440) % 1440;
  const beforeUpcomingShift = untilStart <= 12 * 60;
  if (!beforeUpcomingShift) return 'after';
  if (untilStart <= commuteOutMin + bufferMin) return 'commuting';
  return 'before';
}

function shiftProgress(shift: Shift, now: Date) {
  if (shift.type === 'off' || !shift.start || !shift.end) return null;

  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const overnight = end <= start;
  const duration = overnight ? end + 1440 - start : end - start;
  let current = minutesNow(now);
  if (overnight && current < end) current += 1440;

  const elapsed = Math.max(0, Math.min(duration, current - start));
  const remaining = Math.max(0, duration - elapsed);
  return {
    percent: duration > 0 ? Math.round((elapsed / duration) * 100) : 0,
    remaining,
  };
}

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
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [clockNow, setClockNow] = useState(() => new Date());
  const [moveDoneToday, setMoveDoneToday] = useState(() => moveSessionDoneToday());

  const refreshNow = useCallback(() => {
    const now = new Date();
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setClockNow(now);
    setMoveDoneToday(moveSessionDoneToday(now));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNow();
    }, [refreshNow]),
  );

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const shiftContext = useMemo(() => shiftContextForDate(weekState, clockNow), [clockNow, weekState]);
  const todayShift = shiftContext.shift;
  const snapshot = useMemo<BrainSnapshot>(() => ({ ...dayState.settings, shift: todayShift, energy: dayState.energy }), [dayState.energy, dayState.settings, todayShift]);
  const basePlan = useMemo(() => buildBrainPlan(snapshot), [snapshot]);
  const hasActualExit = Boolean(
    dayState.actualExit
    && dayState.actualExitAt
    && dayState.actualExitShiftKey === shiftContext.key
    && todayShift.type !== 'off',
  );
  const exitImpact = useMemo(
    () => hasActualExit && dayState.actualExit ? assessExitReplanImpact(snapshot, basePlan, dayState.actualExit) : null,
    [basePlan, dayState.actualExit, hasActualExit, snapshot],
  );
  const needsExitReview = Boolean(exitImpact?.requiresConfirmation && !dayState.actualExitReplanConfirmed);
  const plan = useMemo(
    () => hasActualExit && dayState.actualExit
      ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit, !needsExitReview)
      : basePlan,
    [basePlan, dayState.actualExit, hasActualExit, needsExitReview, snapshot],
  );
  const phase = phaseForShift(todayShift, dayState.settings.commuteOutMin, dayState.settings.bufferMin, clockNow);
  const workProgress = phase === 'working' ? shiftProgress(todayShift, clockNow) : null;

  const upcomingMoments = useMemo(() => {
    const current = minutesNow(clockNow);
    const overnight = todayShift.type !== 'off' && Boolean(todayShift.start) && Boolean(todayShift.end) && toMinutes(todayShift.end) <= toMinutes(todayShift.start);

    return plan.moments.filter((item) => {
      if (moveDoneToday && item.type === 'move') return false;
      if (needsExitReview && item.flexible) return false;

      const target = toMinutes(item.time);

      if (phase === 'working') {
        if (item.type === 'work' || item.type === 'commute-out' || item.type === 'prep' || item.type === 'wake') return false;
        if (overnight) {
          return item.type === 'commute-back' || item.type === 'recovery' || item.type === 'rest';
        }
      }

      if (target >= current) return true;
      return phase !== 'off' && current >= 18 * 60 && target <= 6 * 60;
    }).slice(0, 7);
  }, [clockNow, moveDoneToday, needsExitReview, phase, plan.moments, todayShift]);

  useEffect(() => saveDayState(dayState), [dayState]);

  function updateEnergy(energy: Energy) {
    setDayState((current) => ({ ...current, energy }));
  }

  function markActualExit() {
    const now = new Date();
    const actualExit = currentHm(now);
    const impact = assessExitReplanImpact(snapshot, basePlan, actualExit);
    setClockNow(now);
    setDayState((current) => ({
      ...current,
      actualExit,
      actualExitAt: now.toISOString(),
      actualExitShiftKey: shiftContext.key,
      actualExitReplanConfirmed: !impact.requiresConfirmation,
    }));
  }

  function confirmExitReplan() {
    setDayState((current) => ({ ...current, actualExitReplanConfirmed: true }));
  }

  function undoActualExit() {
    setDayState((current) => ({
      ...current,
      actualExit: null,
      actualExitAt: null,
      actualExitShiftKey: null,
      actualExitReplanConfirmed: false,
    }));
  }

  const jornadaLabel = snapshot.shift.type === 'off' ? 'Libre' : `${snapshot.shift.start}–${snapshot.shift.end}`;

  const live = (() => {
    if (hasActualExit && needsExitReview) {
      return {
        title: 'Salida real registrada',
        blue: `${dayState.actualExit} · Falta confirmar un cambio`,
        copy: 'Regreso y recuperación ya siguen tu salida real. Dejé los bloques flexibles fuera hasta que decidas si quieres moverlos.',
        icon: '✓',
      };
    }
    if (hasActualExit) return { title: plan.headline, blue: `${dayState.actualExit} · Salida real`, copy: plan.primary.detail, icon: '✓' };
    if (phase === 'working') return { title: 'Trabajando ahora', blue: `${todayShift.start}–${todayShift.end} · Jornada en curso`, copy: 'Tu jornada está en curso. Cuando termines, toca “Ya salí” y WeekFlow reajustará solo lo flexible.', icon: '💼' };
    if (phase === 'commuting') return { title: 'En camino al trabajo', blue: `${todayShift.start} · Entrada`, copy: 'Ya estás en la ventana de traslado. Lo importante ahora es llegar con margen.', icon: '🚇' };
    if (phase === 'after') return { title: 'Jornada finalizada', blue: `${todayShift.end} · Salida programada`, copy: 'Si saliste a otra hora, registra la salida real para ajustar solo lo que viene después.', icon: '✓' };

    const next = upcomingMoments[0];
    if (next) return { title: plan.headline, blue: `${next.time} · ${next.title}`, copy: next.detail, icon: next.icon };
    if (moveDoneToday) return { title: 'Lo importante de hoy ya está cubierto', blue: 'Move · Hecho', copy: 'No voy a inventarte otra tarea solo para llenar el día.', icon: '✓' };
    return { title: 'Día despejado', blue: 'Sin pendientes inmediatos', copy: 'No hay una acción próxima que necesite competir por tu atención.', icon: '🌿' };
  })();

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
                <Pressable style={styles.exitSecondary} onPress={undoActualExit}>
                  <Text style={styles.exitSecondaryText}>Corregir salida</Text>
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
              <Pressable onPress={undoActualExit} style={styles.correctButton}>
                <Text style={styles.correctButtonText}>Corregir salida</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {upcomingMoments.length ? upcomingMoments.map((item, index) => (
            <View key={`${item.time}-${item.type}-${index}`} style={[styles.timelineRow, index === upcomingMoments.length - 1 && styles.timelineRowLast]}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyTimelineTitle}>Nada urgente después de esto.</Text>
              <Text style={styles.emptyTimelineCopy}>Dejamos el espacio libre en vez de llenarlo por llenar.</Text>
            </View>
          )}
        </View>
      </RefreshableScrollView>
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
  emptyTimeline: { paddingVertical: 18 },
  emptyTimelineTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  emptyTimelineCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
