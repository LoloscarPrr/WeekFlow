import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { KeyboardAwareScrollView, KeyboardAwareTextInput as TextInput } from '@/src/components/KeyboardAwareScrollView';
import {
  clearHabitPlan,
  completeHabit,
  completionForDate,
  completionsThisWeek,
  nextHabitPlanDates,
  replanHabit,
  undoHabitCompletion,
  upsertHabit,
  visibleHabitPlan,
  type Habit,
  type HabitsState,
} from '@/src/habits/core';
import { loadHabitsState, saveHabitsState } from '@/src/habits/persistence';
import { colors } from '@/src/theme/colors';

const areas = [
  {
    icon: '😴',
    title: 'Descanso',
    copy: 'Recuperación según tu turno.',
    path: '/rest',
  },
  {
    icon: '🍽️',
    title: 'Alimentación',
    copy: 'Registra comidas y recibe sugerencias.',
    path: '/food',
  },
  {
    icon: '▦',
    title: 'Tu semana',
    copy: 'Jornadas, días libres y eventos.',
    path: '/week',
  },
] as const;

const frequencyOptions = [1, 2, 3, 4, 5, 7] as const;
const shortDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

function targetCopy(target: number) {
  return `${target} ${target === 1 ? 'vez' : 'veces'} por semana`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function planDateLabel(key: string, now = new Date()) {
  const date = dateFromKey(key);
  const tomorrow = new Date(now);
  tomorrow.setHours(12, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  if (key === tomorrowKey) return `Mañana · ${shortDays[date.getDay()]} ${date.getDate()}`;
  return `${shortDays[date.getDay()]} ${date.getDate()}`;
}

export default function GardenScreen() {
  const [habitsState, setHabitsState] = useState<HabitsState>(() => loadHabitsState());
  const [name, setName] = useState('');
  const [miniVersion, setMiniVersion] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replanningId, setReplanningId] = useState<string | null>(null);

  const habits = useMemo(
    () => habitsState.habits.filter((habit) => habit.active),
    [habitsState.habits],
  );
  const replanOptions = nextHabitPlanDates(new Date(), 7);

  const refresh = useCallback(() => {
    setHabitsState(loadHabitsState());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  function persist(next: HabitsState) {
    setHabitsState(saveHabitsState(next));
  }

  function resetForm() {
    setName('');
    setMiniVersion('');
    setTargetPerWeek(3);
    setEditingId(null);
  }

  function submitHabit() {
    if (!name.trim()) return;
    const next = upsertHabit(
      habitsState,
      { name, miniVersion, targetPerWeek },
      editingId ? { id: editingId } : undefined,
    );
    persist(next);
    resetForm();
  }

  function startEditing(habit: Habit) {
    setEditingId(habit.id);
    setName(habit.name);
    setMiniVersion(habit.miniVersion ?? '');
    setTargetPerWeek(habit.targetPerWeek);
  }

  function markHabit(habitId: string, mode: 'full' | 'mini') {
    persist(completeHabit(habitsState, habitId, mode));
    if (replanningId === habitId) setReplanningId(null);
  }

  function undoToday(habitId: string) {
    persist(undoHabitCompletion(habitsState, habitId));
  }

  function moveHabit(habitId: string, dateKey: string) {
    persist(replanHabit(habitsState, habitId, dateKey));
    setReplanningId(null);
  }

  function makeFlexible(habitId: string) {
    persist(clearHabitPlan(habitsState, habitId));
    setReplanningId(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Brand />
          <Text style={styles.eyebrow}>JARDÍN</Text>
          <Text style={styles.title}>Equilibrio sin puntajes.</Text>
          <Text style={styles.intro}>Hábitos que caben en tu semana real, incluso cuando el día se complica.</Text>

          <Text style={styles.section}>HÁBITOS FLEXIBLES</Text>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar hábito' : 'Crear hábito'}</Text>
            <Text style={styles.formCopy}>Elige una frecuencia orientativa. No tienes que cumplir días fijos.</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej. Leer un rato"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={80}
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Mini-versión (opcional)</Text>
            <TextInput
              value={miniVersion}
              onChangeText={setMiniVersion}
              placeholder="Ej. leer 2 páginas"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={120}
            />

            <Text style={styles.smallLabel}>Frecuencia flexible</Text>
            <View style={styles.frequencyRow}>
              {frequencyOptions.map((option) => {
                const active = targetPerWeek === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setTargetPerWeek(option)}
                    style={[styles.frequencyChip, active && styles.frequencyChipActive]}
                  >
                    <Text style={[styles.frequencyText, active && styles.frequencyTextActive]}>{option}×</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.frequencyHint}>{targetCopy(targetPerWeek)} · puedes hacerlo cualquier día.</Text>

            <View style={styles.formActions}>
              {editingId ? (
                <Pressable style={styles.secondaryButton} onPress={resetForm}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.primaryButton, !name.trim() && styles.buttonDisabled]}
                onPress={submitHabit}
                disabled={!name.trim()}
              >
                <Text style={styles.primaryButtonText}>{editingId ? 'Guardar cambios' : 'Agregar hábito'}</Text>
              </Pressable>
            </View>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no hay hábitos.</Text>
              <Text style={styles.emptyCopy}>Empieza con algo pequeño. La mini-versión existe justamente para esos días en que hacer todo no da.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {habits.map((habit) => {
                const today = completionForDate(habitsState, habit.id);
                const weekDone = completionsThisWeek(habitsState, habit.id);
                const activePlan = visibleHabitPlan(habit);
                const isReplanning = replanningId === habit.id;
                return (
                  <View key={habit.id} style={styles.habitCard}>
                    <View style={styles.habitHeader}>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{habit.name}</Text>
                        <Text style={styles.cardCopy}>Frecuencia flexible · {targetCopy(habit.targetPerWeek)}</Text>
                        {habit.miniVersion ? (
                          <Text style={styles.miniCopy}>Mini · {habit.miniVersion}</Text>
                        ) : null}
                        {weekDone > 0 ? (
                          <Text style={styles.gentleProgress}>
                            Esta semana ya encontraste {weekDone} {weekDone === 1 ? 'momento' : 'momentos'} para hacerlo.
                          </Text>
                        ) : null}
                      </View>
                      <Pressable onPress={() => startEditing(habit)} hitSlop={8}>
                        <Text style={styles.editText}>Editar</Text>
                      </Pressable>
                    </View>

                    {activePlan && !today ? (
                      <View style={styles.planNote}>
                        <Text style={styles.planLabel}>PRÓXIMA OCASIÓN</Text>
                        <Text style={styles.planCopy}>{planDateLabel(activePlan)}. Es una referencia, no una obligación.</Text>
                      </View>
                    ) : null}

                    {today ? (
                      <View style={styles.todayRow}>
                        <View style={styles.todayStatus}>
                          <Text style={styles.todayLabel}>HOY</Text>
                          <Text style={styles.todayDone}>{today.mode === 'mini' ? 'Mini-versión hecha' : 'Hecho'}</Text>
                        </View>
                        <Pressable style={styles.undoButton} onPress={() => undoToday(habit.id)}>
                          <Text style={styles.undoText}>Deshacer</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        <View style={styles.completionActions}>
                          <Pressable style={styles.completeButton} onPress={() => markHabit(habit.id, 'full')}>
                            <Text style={styles.completeButtonText}>Hecho</Text>
                          </Pressable>
                          {habit.miniVersion ? (
                            <Pressable style={styles.miniButton} onPress={() => markHabit(habit.id, 'mini')}>
                              <Text style={styles.miniButtonText}>Versión mini</Text>
                            </Pressable>
                          ) : null}
                        </View>

                        <Pressable
                          style={styles.replanButton}
                          onPress={() => setReplanningId(isReplanning ? null : habit.id)}
                        >
                          <Text style={styles.replanButtonText}>{activePlan ? 'Cambiar día' : 'Mover'}</Text>
                        </Pressable>

                        {isReplanning ? (
                          <View style={styles.replanPanel}>
                            <Text style={styles.replanTitle}>Si hoy no cabe, muévelo sin perder nada.</Text>
                            <View style={styles.replanOptions}>
                              {replanOptions.map((dateKey) => (
                                <Pressable
                                  key={dateKey}
                                  style={[styles.replanChip, activePlan === dateKey && styles.replanChipActive]}
                                  onPress={() => moveHabit(habit.id, dateKey)}
                                >
                                  <Text style={[styles.replanChipText, activePlan === dateKey && styles.replanChipTextActive]}>
                                    {planDateLabel(dateKey)}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                            {activePlan ? (
                              <Pressable style={styles.flexibleButton} onPress={() => makeFlexible(habit.id)}>
                                <Text style={styles.flexibleButtonText}>Dejar flexible</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.section}>ÁREAS DEL JARDÍN</Text>
          <View style={styles.list}>
            {areas.map((area) => (
              <Pressable key={area.title} style={styles.areaCard} onPress={() => router.push(area.path)}>
                <View style={styles.iconWrap}><Text style={styles.icon}>{area.icon}</Text></View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{area.title}</Text>
                  <Text style={styles.cardCopy}>{area.copy}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 150 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 24, marginBottom: 12 },
  list: { gap: 10 },
  formCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 16, gap: 10 },
  formTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  formCopy: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#285785', backgroundColor: colors.surface2, borderRadius: 15, color: colors.text, paddingHorizontal: 14, fontSize: 15 },
  fieldLabel: { color: '#A9C8F2', fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 2 },
  smallLabel: { color: '#9EC5FF', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 2 },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyChip: { minWidth: 45, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  frequencyChipActive: { borderColor: colors.blue, backgroundColor: '#132B50' },
  frequencyText: { color: colors.muted, fontWeight: '800' },
  frequencyTextActive: { color: '#8DC0FF' },
  frequencyHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  formActions: { flexDirection: 'row', gap: 9, justifyContent: 'flex-end', marginTop: 2 },
  primaryButton: { minHeight: 48, borderRadius: 15, backgroundColor: colors.blue, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', flex: 1 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  buttonDisabled: { opacity: 0.45 },
  secondaryButton: { minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#A9C8F2', fontWeight: '800' },
  emptyCard: { marginTop: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, padding: 16 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  habitCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15, gap: 12 },
  habitHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  miniCopy: { color: '#A9C8F2', fontSize: 12, lineHeight: 17, marginTop: 4 },
  gentleProgress: { color: '#78D6A7', fontSize: 12, lineHeight: 17, marginTop: 6 },
  editText: { color: '#78B1FF', fontWeight: '800', fontSize: 13 },
  planNote: { borderRadius: 14, borderWidth: 1, borderColor: '#2E5D8A', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 10 },
  planLabel: { color: '#78B1FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  planCopy: { color: '#C1D7F2', fontSize: 12, lineHeight: 17, marginTop: 3 },
  completionActions: { flexDirection: 'row', gap: 9 },
  completeButton: { minHeight: 46, borderRadius: 14, backgroundColor: colors.blue, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flex: 1 },
  completeButtonText: { color: '#FFFFFF', fontWeight: '900' },
  miniButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#3D77AE', backgroundColor: colors.surface2, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flex: 1 },
  miniButtonText: { color: '#9EC5FF', fontWeight: '900' },
  replanButton: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  replanButtonText: { color: '#A9C8F2', fontWeight: '800', fontSize: 13 },
  replanPanel: { gap: 9, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 },
  replanTitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  replanOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replanChip: { minHeight: 42, minWidth: 76, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  replanChipActive: { borderColor: colors.blue, backgroundColor: '#132B50' },
  replanChipText: { color: '#A9C8F2', fontSize: 12, fontWeight: '800' },
  replanChipTextActive: { color: '#8DC0FF' },
  flexibleButton: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  flexibleButtonText: { color: '#78B1FF', fontSize: 13, fontWeight: '800' },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 },
  todayStatus: { flex: 1 },
  todayLabel: { color: '#78D6A7', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  todayDone: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  undoButton: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  undoText: { color: '#A9C8F2', fontWeight: '800', fontSize: 13 },
  areaCard: { minHeight: 82, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 25 },
});
