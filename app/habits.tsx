import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
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

export default function HabitsScreen() {
  const [habitsState, setHabitsState] = useState<HabitsState>(() => loadHabitsState());
  const [name, setName] = useState('');
  const [miniVersion, setMiniVersion] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replanningId, setReplanningId] = useState<string | null>(null);

  const habits = useMemo(() => habitsState.habits.filter((habit) => habit.active), [habitsState.habits]);
  const replanOptions = nextHabitPlanDates(new Date(), 7);

  const refresh = useCallback(() => setHabitsState(loadHabitsState()), []);
  useFocusEffect(useCallback(() => refresh(), [refresh]));

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
    persist(upsertHabit(habitsState, { name, miniVersion, targetPerWeek }, editingId ? { id: editingId } : undefined));
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

  function moveHabit(habitId: string, dateKey: string) {
    persist(replanHabit(habitsState, habitId, dateKey));
    setReplanningId(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Brand />
          <Text style={styles.eyebrow}>PILARES · HÁBITOS</Text>
          <Text style={styles.title}>Hábitos flexibles, sin culpa.</Text>
          <Text style={styles.intro}>Frecuencia orientativa, mini-versiones y reprogramación cuando la semana cambia.</Text>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? 'Editar hábito' : 'Crear hábito'}</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Ej. Leer un rato" placeholderTextColor={colors.muted} style={styles.input} maxLength={80} returnKeyType="next" />
            <Text style={styles.fieldLabel}>Mini-versión (opcional)</Text>
            <TextInput value={miniVersion} onChangeText={setMiniVersion} placeholder="Ej. leer 2 páginas" placeholderTextColor={colors.muted} style={styles.input} maxLength={120} />
            <Text style={styles.fieldLabel}>Frecuencia flexible</Text>
            <View style={styles.frequencyRow}>
              {frequencyOptions.map((option) => {
                const active = targetPerWeek === option;
                return (
                  <Pressable key={option} onPress={() => setTargetPerWeek(option)} style={[styles.frequencyChip, active && styles.frequencyChipActive]}>
                    <Text style={[styles.frequencyText, active && styles.frequencyTextActive]}>{option}×</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>{targetCopy(targetPerWeek)} · puedes hacerlo cualquier día.</Text>
            <View style={styles.formActions}>
              {editingId ? <Pressable style={styles.secondaryButton} onPress={resetForm}><Text style={styles.secondaryText}>Cancelar</Text></Pressable> : null}
              <Pressable style={[styles.primaryButton, !name.trim() && styles.disabled]} onPress={submitHabit} disabled={!name.trim()}>
                <Text style={styles.primaryText}>{editingId ? 'Guardar cambios' : 'Agregar hábito'}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.section}>MIS HÁBITOS</Text>
          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.cardTitle}>Todavía no hay hábitos.</Text>
              <Text style={styles.cardCopy}>Empieza con algo pequeño. La mini-versión existe para los días en que hacer todo no da.</Text>
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
                    <View style={styles.headerRow}>
                      <View style={styles.grow}>
                        <Text style={styles.cardTitle}>{habit.name}</Text>
                        <Text style={styles.cardCopy}>Frecuencia flexible · {targetCopy(habit.targetPerWeek)}</Text>
                        {habit.miniVersion ? <Text style={styles.miniCopy}>Mini · {habit.miniVersion}</Text> : null}
                        {weekDone > 0 ? <Text style={styles.progress}>Esta semana ya encontraste {weekDone} {weekDone === 1 ? 'momento' : 'momentos'} para hacerlo.</Text> : null}
                      </View>
                      <Pressable onPress={() => startEditing(habit)} hitSlop={8}><Text style={styles.editText}>Editar</Text></Pressable>
                    </View>

                    {activePlan && !today ? (
                      <View style={styles.planNote}>
                        <Text style={styles.planLabel}>PRÓXIMA OCASIÓN</Text>
                        <Text style={styles.planCopy}>{planDateLabel(activePlan)}. Es una referencia, no una obligación.</Text>
                      </View>
                    ) : null}

                    {today ? (
                      <View style={styles.todayRow}>
                        <View style={styles.grow}><Text style={styles.todayLabel}>HOY</Text><Text style={styles.todayDone}>{today.mode === 'mini' ? 'Mini-versión hecha' : 'Hecho'}</Text></View>
                        <Pressable style={styles.secondaryButton} onPress={() => persist(undoHabitCompletion(habitsState, habit.id))}><Text style={styles.secondaryText}>Deshacer</Text></Pressable>
                      </View>
                    ) : (
                      <>
                        <View style={styles.completionRow}>
                          <Pressable style={styles.primaryButton} onPress={() => markHabit(habit.id, 'full')}><Text style={styles.primaryText}>Hecho</Text></Pressable>
                          {habit.miniVersion ? <Pressable style={styles.secondaryButtonGrow} onPress={() => markHabit(habit.id, 'mini')}><Text style={styles.secondaryText}>Versión mini</Text></Pressable> : null}
                        </View>
                        <Pressable style={styles.moveButton} onPress={() => setReplanningId(isReplanning ? null : habit.id)}>
                          <Text style={styles.secondaryText}>{activePlan ? 'Cambiar día' : 'Mover'}</Text>
                        </Pressable>
                        {isReplanning ? (
                          <View style={styles.replanPanel}>
                            <Text style={styles.cardCopy}>Si hoy no cabe, muévelo sin perder nada.</Text>
                            <View style={styles.replanOptions}>
                              {replanOptions.map((dateKey) => (
                                <Pressable key={dateKey} style={[styles.replanChip, activePlan === dateKey && styles.frequencyChipActive]} onPress={() => moveHabit(habit.id, dateKey)}>
                                  <Text style={[styles.frequencyText, activePlan === dateKey && styles.frequencyTextActive]}>{planDateLabel(dateKey)}</Text>
                                </Pressable>
                              ))}
                            </View>
                            {activePlan ? <Pressable onPress={() => { persist(clearHabitPlan(habitsState, habit.id)); setReplanningId(null); }}><Text style={styles.flexibleText}>Dejar flexible</Text></Pressable> : null}
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 150 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 18 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 24, marginBottom: 12 },
  list: { gap: 10 },
  formCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 16, gap: 10 },
  formTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#285785', backgroundColor: colors.surface2, borderRadius: 15, color: colors.text, paddingHorizontal: 14, fontSize: 15 },
  fieldLabel: { color: '#A9C8F2', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyChip: { minWidth: 45, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  frequencyChipActive: { borderColor: colors.blue, backgroundColor: '#132B50' },
  frequencyText: { color: colors.muted, fontWeight: '800' },
  frequencyTextActive: { color: '#8DC0FF' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  formActions: { flexDirection: 'row', gap: 9, marginTop: 2 },
  primaryButton: { minHeight: 46, borderRadius: 14, backgroundColor: colors.blue, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flex: 1 },
  primaryText: { color: '#FFFFFF', fontWeight: '900' },
  disabled: { opacity: 0.45 },
  secondaryButton: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonGrow: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#3D77AE', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', flex: 1 },
  secondaryText: { color: '#A9C8F2', fontWeight: '800', fontSize: 13 },
  emptyCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, padding: 16 },
  habitCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  grow: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  miniCopy: { color: '#A9C8F2', fontSize: 12, lineHeight: 17, marginTop: 4 },
  progress: { color: '#78D6A7', fontSize: 12, lineHeight: 17, marginTop: 6 },
  editText: { color: '#78B1FF', fontWeight: '800', fontSize: 13 },
  planNote: { borderRadius: 14, borderWidth: 1, borderColor: '#2E5D8A', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 10 },
  planLabel: { color: '#78B1FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  planCopy: { color: '#C1D7F2', fontSize: 12, lineHeight: 17, marginTop: 3 },
  completionRow: { flexDirection: 'row', gap: 9 },
  moveButton: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  replanPanel: { gap: 9, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 },
  replanOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replanChip: { minHeight: 42, minWidth: 76, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  flexibleText: { color: '#78B1FF', fontSize: 13, fontWeight: '800', textAlign: 'center', paddingVertical: 8 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 },
  todayLabel: { color: '#78D6A7', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  todayDone: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
});
