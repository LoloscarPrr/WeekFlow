import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import type { BrainSnapshot, Energy, Shift } from '@/src/brain/types';
import {
  loadDayState,
  loadWeekState,
  saveDayState,
  shiftForDate,
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

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
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

export default function NowScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [clockNow, setClockNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      setDayState(loadDayState());
      setWeekState(loadWeekState());
      setClockNow(new Date());
    }, []),
  );

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const todayShift = useMemo(() => shiftForDate(weekState, clockNow), [clockNow, weekState]);
  const snapshot = useMemo<BrainSnapshot>(() => ({ ...dayState.settings, shift: todayShift, energy: dayState.energy }), [dayState.energy, dayState.settings, todayShift]);
  const basePlan = useMemo(() => buildBrainPlan(snapshot), [snapshot]);
  const hasActualExit = Boolean(dayState.actualExit && isToday(dayState.actualExitAt) && todayShift.type !== 'off');
  const plan = useMemo(() => hasActualExit && dayState.actualExit ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit) : basePlan, [basePlan, dayState.actualExit, hasActualExit, snapshot]);
  const phase = phaseForShift(todayShift, dayState.settings.commuteOutMin, dayState.settings.bufferMin, clockNow);
  const workProgress = phase === 'working' ? shiftProgress(todayShift, clockNow) : null;

  useEffect(() => saveDayState(dayState), [dayState]);

  function updateEnergy(energy: Energy) {
    setDayState((current) => ({ ...current, energy }));
  }

  function markActualExit() {
    const now = new Date();
    setClockNow(now);
    setDayState((current) => ({ ...current, actualExit: currentHm(now), actualExitAt: now.toISOString() }));
  }

  const jornadaLabel = snapshot.shift.type === 'off' ? 'Libre' : `${snapshot.shift.start}–${snapshot.shift.end}`;

  const live = (() => {
    if (hasActualExit) return { title: plan.headline, blue: `${dayState.actualExit} · Salida real`, copy: plan.primary.detail, icon: '✓' };
    if (phase === 'working') return { title: 'Trabajando ahora', blue: `${todayShift.start}–${todayShift.end} · Jornada en curso`, copy: 'Tu jornada está en curso. Cuando termines, toca “Ya salí” y WeekFlow reajustará solo lo flexible.', icon: '💼' };
    if (phase === 'commuting') return { title: 'En camino al trabajo', blue: `${todayShift.start} · Entrada`, copy: 'Ya estás en la ventana de traslado. Lo importante ahora es llegar con margen.', icon: '🚇' };
    if (phase === 'after') return { title: 'Jornada finalizada', blue: `${todayShift.end} · Salida programada`, copy: 'Si saliste a otra hora, registra la salida real para ajustar solo lo que viene después.', icon: '✓' };
    return { title: plan.headline, blue: `${plan.primary.time} · ${plan.primary.title}`, copy: plan.primary.detail, icon: plan.primary.icon };
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
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
              <Text style={styles.muted}>{phase === 'working' ? 'Tu jornada está en curso. El resto del día se mantiene en espera.' : plan.summary}</Text>
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

          {phase === 'working' && workProgress ? (
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

          {hasActualExit ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>Salida real registrada · {dayState.actualExit}</Text>
              <Text style={styles.confirmationMuted}>Solo movimos lo flexible. Tu jornada sigue intacta.</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {plan.moments.slice(0, 7).map((item, index) => (
            <View key={`${item.time}-${item.type}-${index}`} style={[styles.timelineRow, index === Math.min(plan.moments.length, 7) - 1 && styles.timelineRowLast]}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: { padding: 22, paddingBottom: 56 },
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
  confirmation: { marginTop: 16, backgroundColor: '#0F4039', borderWidth: 1, borderColor: '#2C7569', borderRadius: 18, padding: 14 },
  confirmationText: { color: '#97E7D4', fontWeight: '900', fontSize: 14 },
  confirmationMuted: { color: '#A6C8C0', fontSize: 12, lineHeight: 18, marginTop: 5 },
  timelineCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  timelineRowLast: { borderBottomWidth: 0 },
  timelineTime: { color: '#6EA8FF', fontSize: 13, fontWeight: '900', width: 48 },
  timelineIcon: { fontSize: 18, width: 24 },
  timelineTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  timelineDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
});