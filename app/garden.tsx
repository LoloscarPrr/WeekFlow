import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { getRestView } from '@/src/application/useCases/getRestView';
import {
  loadGardenPreferences,
  saveGardenPillarPlan,
  type ConfigurableGardenPillarKey,
} from '@/src/garden/preferences';
import { buildGardenPillars, type GardenStatus } from '@/src/garden/summary';
import { loadHabitsState } from '@/src/habits/persistence';
import { loadDayState, loadFoodHistory, loadMoveHistory, loadWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

function statusStyle(status: GardenStatus) {
  if (status === 'Equilibrado') return styles.statusBalanced;
  if (status === 'Necesita atención') return styles.statusAttention;
  if (status === 'Planificado') return styles.statusPlanned;
  return styles.statusNoData;
}

function statusTextStyle(status: GardenStatus) {
  if (status === 'Equilibrado') return styles.statusTextBalanced;
  if (status === 'Necesita atención') return styles.statusTextAttention;
  if (status === 'Planificado') return styles.statusTextPlanned;
  return styles.statusTextNoData;
}

function loadGardenSnapshot(now = new Date()) {
  const dayState = loadDayState();
  const weekState = loadWeekState();
  const preferences = loadGardenPreferences();
  return {
    preferences,
    pillars: buildGardenPillars({
      moveHistory: loadMoveHistory(),
      foodHistory: loadFoodHistory(),
      restView: getRestView(dayState, weekState, now),
      preferences,
      now,
    }),
    activeHabits: loadHabitsState().habits.filter((habit) => habit.active).length,
  };
}

export default function GardenScreen() {
  const [snapshot, setSnapshot] = useState(() => loadGardenSnapshot());
  const [editingKey, setEditingKey] = useState<ConfigurableGardenPillarKey | null>(null);
  const [editorLocation, setEditorLocation] = useState<'inline' | 'tools' | null>(null);
  const [draftDays, setDraftDays] = useState<number[]>([]);
  const pillars = useMemo(() => snapshot.pillars, [snapshot.pillars]);
  const configuredPillars = useMemo(
    () => pillars.filter((pillar) => pillar.configurable && pillar.planDays?.length),
    [pillars],
  );

  const refresh = useCallback(() => setSnapshot(loadGardenSnapshot()), []);
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  function openPillar(route: '/rest' | '/food' | '/pillars' | null) {
    if (route === '/rest') router.push('/rest');
    if (route === '/food') router.push('/food');
    if (route === '/pillars') router.push('/pillars');
  }

  function beginEdit(key: ConfigurableGardenPillarKey, location: 'inline' | 'tools') {
    setEditingKey(key);
    setEditorLocation(location);
    setDraftDays(snapshot.preferences[key]?.days ?? []);
  }

  function toggleDay(day: number) {
    setDraftDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort((a, b) => a - b));
  }

  function savePlan() {
    if (!editingKey || draftDays.length === 0) return;
    saveGardenPillarPlan(snapshot.preferences, editingKey, draftDays);
    setSnapshot(loadGardenSnapshot());
    setEditingKey(null);
    setEditorLocation(null);
    setDraftDays([]);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditorLocation(null);
    setDraftDays([]);
  }

  function renderDayEditor(title: string) {
    return (
      <View style={styles.editorCard}>
        <Text style={styles.editorEyebrow}>PLAN SEMANAL</Text>
        <Text style={styles.editorTitle}>{title}</Text>
        <Text style={styles.editorCopy}>Elige los días que te gustaría dedicarle. Es una intención flexible, no una obligación.</Text>
        <View style={styles.dayRow}>
          {DAYS.map((day) => {
            const selected = draftDays.includes(day.value);
            return (
              <Pressable
                key={day.value}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
                onPress={() => toggleDay(day.value)}
              >
                <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.editorActions}>
          <Pressable style={styles.cancelButton} onPress={cancelEdit}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
          <Pressable style={[styles.saveButton, draftDays.length === 0 && styles.saveButtonDisabled]} onPress={savePlan} disabled={draftDays.length === 0}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </Pressable>
        </View>
      </View>
    );
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
          <Text style={styles.focusCopy}>WeekFlow muestra señales reales cuando las tiene. En los pilares personales, primero puedes definir qué días quieres reservarles.</Text>
        </View>

        <Text style={styles.section}>TUS PILARES</Text>
        <View style={styles.list}>
          {pillars.map((pillar) => {
            const interactive = Boolean(pillar.route);
            const noData = pillar.status === 'Sin datos';
            const canConfigure = Boolean(pillar.configurable && !pillar.planDays?.length);
            const editingInline = editorLocation === 'inline' && editingKey === pillar.key;
            return (
              <View key={pillar.key} style={[styles.pillarCard, noData && styles.pillarCardCompact]}>
                <View style={styles.pillarTopRow}>
                  <View style={styles.iconWrap}><Text style={styles.icon}>{pillar.icon}</Text></View>
                  <View style={styles.pillarContent}>
                    <View style={styles.pillarHeader}>
                      <Text style={styles.cardTitle}>{pillar.title}</Text>
                      {interactive ? (
                        <Pressable onPress={() => openPillar(pillar.route)} hitSlop={10}>
                          <Text style={styles.arrow}>›</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <View style={styles.pillarMetaRow}>
                      <Text style={styles.cardCopy}>{pillar.evidence}</Text>
                      <View style={[styles.statusPill, statusStyle(pillar.status)]}>
                        <Text style={[styles.statusText, statusTextStyle(pillar.status)]}>{pillar.status}</Text>
                      </View>
                    </View>
                    {canConfigure && !editingInline ? (
                      <Pressable style={styles.configureButton} onPress={() => beginEdit(pillar.key as ConfigurableGardenPillarKey, 'inline')}>
                        <Text style={styles.configureButtonText}>Configurar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {editingInline ? renderDayEditor(pillar.title) : null}
              </View>
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

        {configuredPillars.length > 0 ? (
          <View style={styles.editToolCard}>
            <View style={styles.toolHeader}>
              <View style={styles.toolIcon}><Text style={styles.icon}>🛠️</Text></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Editar pilares</Text>
                <Text style={styles.cardCopy}>Cambia los días de los pilares que ya configuraste.</Text>
              </View>
            </View>
            <View style={styles.editPillarButtons}>
              {configuredPillars.map((pillar) => (
                <Pressable key={pillar.key} style={styles.editPillarButton} onPress={() => beginEdit(pillar.key as ConfigurableGardenPillarKey, 'tools')}>
                  <Text style={styles.editPillarButtonText}>{pillar.title}</Text>
                </Pressable>
              ))}
            </View>
            {editorLocation === 'tools' && editingKey
              ? renderDayEditor(pillars.find((pillar) => pillar.key === editingKey)?.title ?? 'Pilar')
              : null}
          </View>
        ) : null}

        <Text style={styles.footerCopy}>Configurar días solo define una intención semanal. Más adelante el Jardín podrá contrastarla con actividad real sin convertirla en una nota.</Text>
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
  pillarCard: { minHeight: 96, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 14, gap: 12 },
  pillarCardCompact: { minHeight: 82, paddingVertical: 11 },
  pillarTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  statusPlanned: { borderColor: '#426AA8', backgroundColor: '#102A50' },
  statusNoData: { borderColor: colors.line, backgroundColor: colors.surface2 },
  statusText: { fontSize: 10, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  statusTextBalanced: { color: '#8FD7EE' },
  statusTextAttention: { color: '#F2C66D' },
  statusTextPlanned: { color: '#9FC4FF' },
  statusTextNoData: { color: colors.muted },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 25, flexShrink: 0 },
  configureButton: { alignSelf: 'flex-start', marginTop: 7, minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: '#3977BE', backgroundColor: '#102B50', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  configureButtonText: { color: '#9CC7FF', fontSize: 11, fontWeight: '900' },
  editorCard: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 13 },
  editorEyebrow: { color: '#79B6FF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  editorTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 4 },
  editorCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  dayChip: { minWidth: 48, minHeight: 38, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  dayChipSelected: { borderColor: '#4C9AFF', backgroundColor: '#153764' },
  dayChipText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  dayChipTextSelected: { color: '#BBD8FF' },
  editorActions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  cancelButton: { flex: 1, minHeight: 42, borderRadius: 15, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  saveButton: { flex: 1, minHeight: 42, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: '#F7FAFF', fontSize: 12, fontWeight: '900' },
  toolCard: { minHeight: 86, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#285785', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  toolIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#102E36', borderWidth: 1, borderColor: '#2F726F', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editToolCard: { marginTop: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#285785', borderRadius: 20, padding: 14 },
  toolHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  editPillarButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  editPillarButton: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: '#315D8E', backgroundColor: colors.surface2, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  editPillarButtonText: { color: '#AFC9EA', fontSize: 11, fontWeight: '900' },
  footerCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});
