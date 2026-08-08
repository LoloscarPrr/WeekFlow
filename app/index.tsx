import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import type { BrainSnapshot, Energy } from '@/src/brain/types';
import { loadDayState, saveDayState, type PersistedDayState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const energyOptions: { value: Energy; label: string; icon: string }[] = [
  { value: 'vigoroso', label: 'Vigoroso', icon: '🔋' },
  { value: 'bien', label: 'Bien', icon: '🙂' },
  { value: 'cansado', label: 'Cansado', icon: '😮‍💨' },
  { value: 'agotado', label: 'Agotado', icon: '😴' },
];

function currentHm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function NowScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());

  const snapshot = useMemo<BrainSnapshot>(
    () => ({ ...dayState.snapshot, energy: dayState.energy }),
    [dayState.energy, dayState.snapshot],
  );

  const basePlan = useMemo(() => buildBrainPlan(snapshot), [snapshot]);
  const hasActualExit = Boolean(dayState.actualExit && isToday(dayState.actualExitAt));
  const plan = useMemo(
    () =>
      hasActualExit && dayState.actualExit
        ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit)
        : basePlan,
    [basePlan, dayState.actualExit, hasActualExit, snapshot],
  );

  useEffect(() => {
    saveDayState(dayState);
  }, [dayState]);

  function updateEnergy(energy: Energy) {
    setDayState((current) => ({ ...current, energy }));
  }

  function markActualExit() {
    const now = new Date();
    setDayState((current) => ({
      ...current,
      actualExit: currentHm(),
      actualExitAt: now.toISOString(),
    }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <View style={styles.build}>
            <Text style={styles.buildText}>Build 4.8.2</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AHORA</Text>
          <Text style={styles.title}>
            Tu semana{'\n'}fluye contigo<Text style={styles.blue}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Día Vivo ya recuerda tu estado y reacciona a la hora real.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.brainIcon}><Text style={styles.emoji}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>WeekFlow Brain</Text>
              <Text style={styles.muted}>{plan.summary}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat value={`${snapshot.shift.start}–${snapshot.shift.end}`} label="Turno" />
            <Stat value={`${snapshot.commuteOutMin}/${snapshot.commuteBackMin}`} label="Ida / vuelta" />
            <Stat value={energyLabel(dayState.energy)} label="Energía" />
          </View>
        </View>

        <Text style={styles.section}>¿CÓMO LLEGAS HOY?</Text>
        <View style={styles.energyGrid}>
          {energyOptions.map((item) => {
            const active = item.value === dayState.energy;
            return (
              <Pressable
                key={item.value}
                style={[styles.energyButton, active && styles.energyButtonActive]}
                onPress={() => updateEnergy(item.value)}
              >
                <Text style={styles.energyIcon}>{item.icon}</Text>
                <Text style={[styles.energyText, active && styles.energyTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>DÍA VIVO</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveIcon}><Text style={styles.emoji}>{plan.primary.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>{plan.headline}</Text>
              <Text style={styles.liveBlue}>{plan.primary.time} · {plan.primary.title}</Text>
            </View>
          </View>
          <Text style={styles.liveCopy}>{plan.primary.detail}</Text>

          {snapshot.shift.type !== 'off' && !hasActualExit ? (
            <Pressable style={styles.exitButton} onPress={markActualExit}>
              <Text style={styles.exitButtonText}>✓ Ya salí</Text>
            </Pressable>
          ) : hasActualExit ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>Salida real registrada · {dayState.actualExit}</Text>
              <Text style={styles.confirmationMuted}>Solo movimos lo flexible. Tu turno y prioridades siguen protegidos.</Text>
            </View>
          ) : (
            <View style={styles.button}>
              <Text style={styles.buttonText}>Día libre · dejamos espacio real</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {plan.moments.map((item, index) => (
            <View
              key={`${item.time}-${item.type}-${index}`}
              style={[styles.timelineRow, index === plan.moments.length - 1 && styles.timelineRowLast]}
            >
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>
                  {item.detail}{item.flexible ? ' · Flexible' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Core / Día Vivo v4.8.2</Text>
          <Text style={styles.infoText}>
            • energía y estado del día persisten en SQLite{'\n'}
            • cerrar y abrir la app ya no reinicia el contexto{'\n'}
            • “Ya salí” guarda la hora real{'\n'}
            • el Brain reprograma regreso, recuperación y bloques flexibles{'\n'}
            • ida y regreso siguen siendo independientes{'\n'}
            • el siguiente bloque canónico es consolidar turnos/semanas persistentes
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function energyLabel(energy: Energy) {
  return energyOptions.find((item) => item.value === energy)?.label ?? 'Bien';
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
  content: { padding: 22, paddingBottom: 48 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  build: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buildText: { color: colors.text, fontSize: 14 },
  hero: { marginTop: 36, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 50, lineHeight: 54, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 18, marginTop: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 28, padding: 20 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brainIcon: { width: 55, height: 55, borderRadius: 17, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22529A' },
  emoji: { fontSize: 28 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 9, marginTop: 20 },
  stat: { flex: 1, padding: 13, borderRadius: 18, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151' },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 15 },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 13 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 28, marginBottom: 12 },
  energyGrid: { flexDirection: 'row', gap: 8 },
  energyButton: { flex: 1, minHeight: 76, borderRadius: 18, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  energyButtonActive: { backgroundColor: '#102D52', borderColor: colors.blue },
  energyIcon: { fontSize: 23 },
  energyText: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 5 },
  energyTextActive: { color: colors.text },
  liveCard: { backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#1C477F', borderRadius: 28, padding: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  liveIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.blue },
  liveTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  liveBlue: { color: colors.blue, fontWeight: '800', fontSize: 17, marginTop: 3 },
  liveCopy: { color: '#BCCBE0', fontSize: 16, lineHeight: 23, marginTop: 20 },
  button: { backgroundColor: '#17345E', borderWidth: 1, borderColor: '#2C5C9B', borderRadius: 20, padding: 17, alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  exitButton: { backgroundColor: colors.blue, borderRadius: 20, padding: 17, alignItems: 'center', marginTop: 20 },
  exitButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  confirmation: { backgroundColor: '#0D322F', borderWidth: 1, borderColor: '#1E6B61', borderRadius: 20, padding: 16, marginTop: 20 },
  confirmationText: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  confirmationMuted: { color: '#91BEB6', fontSize: 13, lineHeight: 19, marginTop: 5 },
  timelineCard: { backgroundColor: '#09182C', borderWidth: 1, borderColor: '#173151', borderRadius: 26, paddingHorizontal: 18 },
  timelineRow: { flexDirection: 'row', gap: 11, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#132A47' },
  timelineRowLast: { borderBottomWidth: 0 },
  timelineTime: { width: 45, color: '#68C7FF', fontSize: 13, fontWeight: '800', paddingTop: 2 },
  timelineIcon: { width: 25, fontSize: 19 },
  timelineTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  timelineDetail: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  info: { marginTop: 14, padding: 20, borderRadius: 24, backgroundColor: '#071526', borderWidth: 1, borderColor: '#15304E' },
  infoTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  infoText: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 10 },
});
