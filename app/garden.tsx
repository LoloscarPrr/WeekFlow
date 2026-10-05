import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { getRestView } from '@/src/application/useCases/getRestView';
import { buildGardenPillars, type GardenStatus } from '@/src/garden/summary';
import { loadHabitsState } from '@/src/habits/persistence';
import { loadDayState, loadFoodHistory, loadMoveHistory, loadWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

function statusStyle(status: GardenStatus) {
  if (status === 'Equilibrado') return styles.statusBalanced;
  if (status === 'Necesita atención') return styles.statusAttention;
  return styles.statusNoData;
}

function statusTextStyle(status: GardenStatus) {
  if (status === 'Equilibrado') return styles.statusTextBalanced;
  if (status === 'Necesita atención') return styles.statusTextAttention;
  return styles.statusTextNoData;
}

function loadGardenSnapshot(now = new Date()) {
  const dayState = loadDayState();
  const weekState = loadWeekState();
  return {
    pillars: buildGardenPillars({
      moveHistory: loadMoveHistory(),
      foodHistory: loadFoodHistory(),
      restView: getRestView(dayState, weekState, now),
      now,
    }),
    activeHabits: loadHabitsState().habits.filter((habit) => habit.active).length,
  };
}

export default function GardenScreen() {
  const [snapshot, setSnapshot] = useState(() => loadGardenSnapshot());
  const pillars = useMemo(() => snapshot.pillars, [snapshot.pillars]);

  const refresh = useCallback(() => setSnapshot(loadGardenSnapshot()), []);
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  function openPillar(route: '/rest' | '/food' | '/pillars' | null) {
    if (route === '/rest') router.push('/rest');
    if (route === '/food') router.push('/food');
    if (route === '/pillars') router.push('/pillars');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>JARDÍN</Text>
        <Text style={styles.title}>Tu jardín esta semana.</Text>
        <Text style={styles.intro}>Una vista amable de cómo estás cuidando tus pilares. No es una nota ni una competencia.</Text>

        <View style={styles.focusCard}>
          <Text style={styles.focusEyebrow}>VISTA GENERAL</Text>
          <Text style={styles.focusTitle}>Cuidar no significa completar todo.</Text>
          <Text style={styles.focusCopy}>WeekFlow muestra señales reales cuando las tiene y dice “Sin datos” cuando todavía no sabe. No rellena huecos inventando progreso.</Text>
        </View>

        <Text style={styles.section}>TUS PILARES</Text>
        <View style={styles.list}>
          {pillars.map((pillar) => {
            const interactive = Boolean(pillar.route);
            const noData = pillar.status === 'Sin datos';
            return (
              <Pressable
                key={pillar.key}
                style={({ pressed }) => [
                  styles.pillarCard,
                  noData && styles.pillarCardCompact,
                  pressed && interactive && styles.cardPressed,
                ]}
                onPress={() => openPillar(pillar.route)}
                disabled={!interactive}
              >
                <View style={styles.iconWrap}><Text style={styles.icon}>{pillar.icon}</Text></View>
                <View style={styles.pillarContent}>
                  <View style={styles.pillarHeader}>
                    <Text style={styles.cardTitle}>{pillar.title}</Text>
                    {interactive ? <Text style={styles.arrow}>›</Text> : null}
                  </View>
                  <View style={styles.pillarMetaRow}>
                    <Text style={styles.cardCopy}>{pillar.evidence}</Text>
                    <View style={[styles.statusPill, statusStyle(pillar.status)]}>
                      <Text style={[styles.statusText, statusTextStyle(pillar.status)]}>{pillar.status}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>HERRAMIENTAS</Text>
        <Pressable style={({ pressed }) => [styles.toolCard, pressed && styles.cardPressed]} onPress={() => router.push('/habits')}>
          <View style={styles.toolIcon}><Text style={styles.icon}>🌱</Text></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Hábitos flexibles</Text>
            <Text style={styles.cardCopy}>
              {snapshot.activeHabits > 0
                ? `${snapshot.activeHabits} ${snapshot.activeHabits === 1 ? 'hábito activo' : 'hábitos activos'}. Gestiona frecuencia, mini-versión y próximo día.`
                : 'Crea hábitos por frecuencia semanal, con mini-versiones y sin rachas punitivas.'}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.footerCopy}>Los pilares sin datos se activarán cuando WeekFlow tenga una fuente real y coherente para ellos.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 150 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  focusCard: { marginTop: 18, backgroundColor: '#102944', borderWidth: 1, borderColor: '#285785', borderRadius: 22, padding: 17 },
  focusEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  focusTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 6 },
  focusCopy: { color: '#B8C9DE', fontSize: 13, lineHeight: 19, marginTop: 5 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 26, marginBottom: 12 },
  list: { gap: 10 },
  pillarCard: { minHeight: 96, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarCardCompact: { minHeight: 82, paddingVertical: 11 },
  cardPressed: { opacity: 0.78 },
  iconWrap: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 25 },
  pillarContent: { flex: 1, minWidth: 0, gap: 4 },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillarMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16, flex: 1, flexShrink: 1 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3, flexGrow: 1, flexShrink: 1, minWidth: 140 },
  statusPill: { minHeight: 32, borderRadius: 17, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, maxWidth: '100%' },
  statusBalanced: { borderColor: '#2B7FA0', backgroundColor: '#0D2C43' },
  statusAttention: { borderColor: '#8B6A2D', backgroundColor: '#2B2414' },
  statusNoData: { borderColor: colors.line, backgroundColor: colors.surface2 },
  statusText: { fontSize: 10, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  statusTextBalanced: { color: '#8FD7EE' },
  statusTextAttention: { color: '#F2C66D' },
  statusTextNoData: { color: colors.muted },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 25, flexShrink: 0 },
  toolCard: { minHeight: 86, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#285785', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  toolIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#102E36', borderWidth: 1, borderColor: '#2F726F', alignItems: 'center', justifyContent: 'center' },
  footerCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});
