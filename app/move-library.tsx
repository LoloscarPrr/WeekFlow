import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import {
  MOVE_EXERCISE_LIBRARY,
  MOVE_PATTERN_LABELS,
  type MovePattern,
} from '@/src/move/exerciseCatalog';
import {
  moveExerciseCompatible,
  moveExerciseEquipmentLabel,
  moveExerciseSelectionEligible,
} from '@/src/move/library';
import { MOVE_EXPERIENCE_OPTIONS, type MovePreferences } from '@/src/move/adaptation';
import { loadMovePreferences, saveMovePreferences } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

type PatternFilter = 'all' | MovePattern;

const PATTERNS: { value: PatternFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(MOVE_PATTERN_LABELS).map(([value, label]) => ({
    value: value as MovePattern,
    label,
  })),
];

export default function MoveLibraryScreen() {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<MovePreferences>(() => loadMovePreferences());
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState<PatternFilter>('all');
  const [compatibleOnly, setCompatibleOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MOVE_EXERCISE_LIBRARY
      .filter((exercise) => pattern === 'all' || exercise.pattern === pattern)
      .filter((exercise) => !compatibleOnly || moveExerciseSelectionEligible(exercise, preferences))
      .filter((exercise) => {
        if (!needle) return true;
        const equipment = (exercise.equipment ?? []).join(' ');
        return `${exercise.title} ${MOVE_PATTERN_LABELS[exercise.pattern]} ${equipment}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        if (a.pattern !== b.pattern) return a.pattern.localeCompare(b.pattern);
        if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
        return a.title.localeCompare(b.title);
      });
  }, [compatibleOnly, pattern, preferences, query]);

  const profileCompatibleExercises = useMemo(
    () => MOVE_EXERCISE_LIBRARY.filter((exercise) => moveExerciseSelectionEligible(exercise, preferences)),
    [preferences],
  );
  const excludedCompatibleCount = profileCompatibleExercises.filter((exercise) => preferences.excludedExerciseIds.includes(exercise.id)).length;
  const allowedCompatibleCount = profileCompatibleExercises.length - excludedCompatibleCount;
  const experienceLabel = MOVE_EXPERIENCE_OPTIONS.find((item) => item.value === preferences.experience)?.label ?? 'Sin definir';

  function setExerciseAllowed(exerciseId: string, allowed: boolean) {
    const nextExcluded = allowed
      ? preferences.excludedExerciseIds.filter((id) => id !== exerciseId)
      : Array.from(new Set([...preferences.excludedExerciseIds, exerciseId]));
    const next = { ...preferences, excludedExerciseIds: nextExcluded };
    saveMovePreferences(next);
    setPreferences(loadMovePreferences());
  }

  function resetExerciseSelection() {
    saveMovePreferences({ ...preferences, excludedExerciseIds: [] });
    setPreferences(loadMovePreferences());
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
      >
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MOVE · BIBLIOTECA</Text>
          <Text style={styles.title}>Ejercicios que pueden crecer contigo.</Text>
          <Text style={styles.copy}>
            La biblioteca no separa ejercicios por género ni usa “tipos de cuerpo”.
            Move filtra por energía, experiencia, impacto, restricciones, equipo real y dificultad previa.
          </Text>
        </View>

        <View style={styles.learningCard}>
          <Text style={styles.learningTitle}>Cómo aprende Move</Text>
          <Text style={styles.learningCopy}>
            Muy fácil → intenta subir una variante. Bien → mantiene el nivel. Difícil → baja una variante.
            Demasiado → baja más y también reduce la dosis. Tus kilos registrados nunca aumentan solos.
          </Text>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar ejercicio o equipo"
          placeholderTextColor="#60728E"
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PATTERNS.map((item) => {
            const active = pattern === item.value;
            return (
              <Pressable
                key={item.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPattern(item.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={[styles.compatible, compatibleOnly && styles.compatibleActive]}
          onPress={() => setCompatibleOnly((value) => !value)}
        >
          <Text style={styles.compatibleIcon}>{compatibleOnly ? '✓' : '○'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.compatibleTitle}>Solo compatibles con mi perfil actual</Text>
            <Text style={styles.compatibleCopy}>Usa tu nivel, restricciones y equipo registrado. La intensidad del día se aplica después.</Text>
          </View>
        </Pressable>

        <View style={styles.selectionSummary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectionTitle}>Tu nivel: {experienceLabel}</Text>
            <Text style={styles.selectionCopy}>{allowedCompatibleCount} permitidos · {excludedCompatibleCount} excluidos por ti</Text>
          </View>
          {preferences.excludedExerciseIds.length > 0 ? (
            <Pressable style={styles.resetButton} onPress={resetExerciseSelection}>
              <Text style={styles.resetText}>Restablecer</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.count}>{filtered.length} ejercicios visibles</Text>

        <View style={styles.list}>
          {filtered.map((exercise) => {
            const profileCompatible = moveExerciseSelectionEligible(exercise, preferences);
            const excludedByUser = preferences.excludedExerciseIds.includes(exercise.id);
            const compatible = moveExerciseCompatible(exercise, preferences, 'moderada');
            const equipment = moveExerciseEquipmentLabel(exercise, preferences);
            const statusLabel = !profileCompatible ? 'No compatible' : excludedByUser ? 'Excluido por ti' : 'Permitido';
            const statusSymbol = !profileCompatible ? '🔒' : excludedByUser ? '—' : '✓';
            return (
              <View key={exercise.id} style={[styles.card, excludedByUser && styles.cardExcluded]}>
                <View style={styles.cardHead}>
                  <Text style={styles.icon}>{exercise.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <Text style={styles.meta}>
                      {MOVE_PATTERN_LABELS[exercise.pattern]} · Dificultad {exercise.difficulty}/5 · Impacto {exercise.impact === 'low' ? 'bajo' : exercise.impact === 'medium' ? 'medio' : 'alto'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={profileCompatible ? `${statusLabel}. Toca para ${excludedByUser ? 'permitir' : 'excluir'} ${exercise.title}` : `${exercise.title}: no compatible con el perfil actual`}
                    disabled={!profileCompatible}
                    style={[
                      styles.statusButton,
                      compatible && styles.statusButtonAllowed,
                      excludedByUser && styles.statusButtonExcluded,
                      !profileCompatible && styles.statusButtonLocked,
                    ]}
                    onPress={() => setExerciseAllowed(exercise.id, excludedByUser)}
                  >
                    <Text style={[
                      styles.statusSymbol,
                      compatible && styles.statusSymbolAllowed,
                      excludedByUser && styles.statusSymbolExcluded,
                    ]}>{statusSymbol}</Text>
                  </Pressable>
                </View>
                <Text style={[
                  styles.selectionState,
                  compatible && styles.selectionStateAllowed,
                  excludedByUser && styles.selectionStateExcluded,
                ]}>{statusLabel}</Text>
                {(exercise.equipment?.length ?? 0) > 0 ? (
                  <Text style={styles.equipment}>
                    {equipment ?? `Requiere: ${exercise.equipment?.join(' · ')}`}
                  </Text>
                ) : (
                  <Text style={styles.equipment}>Peso corporal / sin equipo externo</Text>
                )}
                <Text style={styles.cue}>{exercise.cue}</Text>
                <Text style={styles.easier}>Más fácil: {exercise.easier}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  back: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  backText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  hero: { marginTop: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 3, fontSize: 12 },
  title: { color: colors.text, fontWeight: '900', fontSize: 29, lineHeight: 35, marginTop: 7 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  learningCard: { marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: '#2D6298', backgroundColor: '#0D2948', padding: 14 },
  learningTitle: { color: '#8FC2FF', fontWeight: '900', fontSize: 13 },
  learningCopy: { color: '#BDD1E8', fontSize: 11, lineHeight: 17, marginTop: 4 },
  search: { marginTop: 16, minHeight: 50, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 14, fontSize: 14 },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 },
  chipActive: { borderColor: '#397EC4', backgroundColor: '#163B68' },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  compatible: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 12 },
  compatibleActive: { borderColor: '#397EC4', backgroundColor: '#102B4B' },
  compatibleIcon: { color: '#78B7FF', fontSize: 18, fontWeight: '900' },
  compatibleTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  compatibleCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  selectionSummary: { marginTop: 14, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 12 },
  selectionTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  selectionCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  resetButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 11, borderWidth: 1, borderColor: '#376A9E', backgroundColor: '#102B4B' },
  resetText: { color: '#9CCBFF', fontSize: 10, fontWeight: '900' },
  count: { color: '#7F96B5', fontSize: 11, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  list: { gap: 10 },
  card: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  cardExcluded: { opacity: 0.74, borderColor: '#5B4B55' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { fontSize: 24, width: 32 },
  exerciseTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  meta: { color: '#7990AE', fontSize: 9, fontWeight: '800', marginTop: 3, lineHeight: 13 },
  statusButton: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  statusButtonAllowed: { borderColor: '#37796D', backgroundColor: '#103A35' },
  statusButtonExcluded: { borderColor: '#725D66', backgroundColor: '#241A22' },
  statusButtonLocked: { opacity: 0.55 },
  statusSymbol: { color: '#71829B', fontWeight: '900', fontSize: 18 },
  statusSymbolAllowed: { color: '#8FE0CD' },
  statusSymbolExcluded: { color: '#D8AEBE' },
  selectionState: { alignSelf: 'flex-start', color: '#71829B', fontSize: 9, fontWeight: '900', marginTop: 8 },
  selectionStateAllowed: { color: '#8FCFBE' },
  selectionStateExcluded: { color: '#C697A9' },
  equipment: { alignSelf: 'flex-start', color: '#8BC1FF', backgroundColor: '#102B4B', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: '900', marginTop: 10 },
  cue: { color: '#C4D2E5', fontSize: 11, lineHeight: 17, marginTop: 9 },
  easier: { color: '#8194AE', fontSize: 10, lineHeight: 15, marginTop: 5 },
});
