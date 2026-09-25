import { KeyboardAwareTextInput as TextInput } from '@/src/components/KeyboardAwareScrollView';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { TimeEditModal } from '@/src/components/TimeEditModal';
import { FoodGuidedRecipe } from '@/src/food/FoodGuidedRecipe';
import { FoodRecipeCard } from '@/src/food/FoodRecipeCard';
import { FoodPantryPhotoCapture } from '@/src/food/FoodPantryPhotoCapture';
import { preparedPortionCount, type FoodPreparedMeal } from '@/src/food/prep';
import {
  addShoppingItems,
  mergeFoodPantry,
  parseFoodPantryInput,
  type FoodBudgetPreference,
  type FoodCookingEffort,
  type FoodMaxMinutes,
} from '@/src/food/pantry';
import {
  matchFoodRecipe,
  rankFoodRecipes,
  type FoodRecipeMatch,
} from '@/src/food/recommendations';
import { RECIPES, type FoodRecipe } from '@/src/food/recipes';
import { contextCopy, contextTitle, foodContextForShift } from '@/src/food/suggestions';
import {
  loadDayState,
  loadFoodDay,
  loadFoodPantry,
  loadFoodPreferences,
  loadFoodPrepared,
  loadFoodShopping,
  loadWeekState,
  removeFoodEntry,
  saveFoodEntry,
  saveFoodPantry,
  saveFoodPreferences,
  saveFoodShopping,
  shiftForDate,
  updateFoodEntryTime,
  type FoodDayRecord,
  type FoodEntry,
  type FoodPantryItem,
  type FoodPreferences,
  type FoodShoppingItem,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

function timeLabel(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function sourceLabel(entry: FoodEntry) {
  if (entry.source === 'manual') return 'Registrado por ti';
  if (entry.source === 'recipe') return 'Cocinado con Food';
  if (entry.source === 'prepared') return 'Desde una porción preparada';
  return 'Desde una sugerencia';
}

export default function FoodScreen() {
  const initialNow = useMemo(() => new Date(), []);
  const [clockNow, setClockNow] = useState(initialNow);
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [foodDay, setFoodDay] = useState<FoodDayRecord>(() => loadFoodDay(initialNow));
  const [pantry, setPantry] = useState<FoodPantryItem[]>(() => loadFoodPantry());
  const [foodPreferences, setFoodPreferences] = useState<FoodPreferences>(() => loadFoodPreferences());
  const [shopping, setShopping] = useState<FoodShoppingItem[]>(() => loadFoodShopping());
  const [prepared, setPrepared] = useState<FoodPreparedMeal[]>(() => loadFoodPrepared());
  const [pantryOpen, setPantryOpen] = useState(false);
  const [pantryText, setPantryText] = useState('');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [guidedRecipe, setGuidedRecipe] = useState<FoodRecipe | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const todayShift = useMemo(() => shiftForDate(weekState, clockNow), [clockNow, weekState]);
  const context = useMemo(() => foodContextForShift(clockNow, todayShift), [clockNow, todayShift]);
  const lowEnergy = dayState.energy === 'cansado' || dayState.energy === 'agotado';
  const rankedRecipes = useMemo(
    () => rankFoodRecipes(RECIPES, pantry, foodPreferences, { context, lowEnergy }),
    [context, foodPreferences, lowEnergy, pantry],
  );
  const topRecipes = rankedRecipes.slice(0, 3);
  const guidedMatch = useMemo(
    () => guidedRecipe ? matchFoodRecipe(guidedRecipe, pantry, foodPreferences, { context, lowEnergy }) : null,
    [context, foodPreferences, guidedRecipe, lowEnergy, pantry],
  );
  const pendingShopping = shopping.filter((item) => !item.checked).length;
  const preparedPortions = preparedPortionCount(prepared);

  const refreshFood = useCallback(() => {
    const now = new Date();
    setClockNow(now);
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setFoodDay(loadFoodDay(now));
    setPantry(loadFoodPantry());
    setFoodPreferences(loadFoodPreferences());
    setShopping(loadFoodShopping());
    setPrepared(loadFoodPrepared());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshFood();
    }, [refreshFood]),
  );

  function logRecipe(recipe: FoodRecipe) {
    const entry: FoodEntry = {
      id: `${Date.now()}-${recipe.id}`,
      at: new Date().toISOString(),
      title: recipe.title,
      kind: 'meal',
      source: 'recipe',
    };
    setFoodDay(saveFoodEntry(entry));
  }

  function addManual() {
    const title = manualText.trim();
    if (!title) return;
    const entry: FoodEntry = {
      id: `${Date.now()}-manual`,
      at: new Date().toISOString(),
      title,
      kind: 'other',
      source: 'manual',
    };
    setFoodDay(saveFoodEntry(entry));
    setManualText('');
    setManualOpen(false);
  }

  function removeEntry(id: string) {
    setFoodDay(removeFoodEntry(id));
  }

  function correctEntryTime(time: string) {
    if (!editingEntry) return;
    setFoodDay(updateFoodEntryTime(editingEntry.id, time, foodDay.date));
    setEditingEntry(null);
  }


  function addPantryText() {
    const incoming = parseFoodPantryInput(pantryText);
    if (!incoming.length) return;
    const next = mergeFoodPantry(pantry, incoming);
    setPantry(saveFoodPantry(next));
    setPantryText('');
    setPantryOpen(false);
  }

  function removePantryItem(key: string) {
    setPantry(saveFoodPantry(pantry.filter((item) => item.key !== key)));
  }

  function addPhotoPantry(items: FoodPantryItem[]) {
    if (!items.length) return;
    setPantry(saveFoodPantry(mergeFoodPantry(pantry, items)));
  }

  function updatePreferences(patch: Partial<FoodPreferences>) {
    const next = saveFoodPreferences({ ...foodPreferences, ...patch });
    setFoodPreferences(next);
  }

  function addMissingToShopping(match: FoodRecipeMatch) {
    if (!match.missing.length) return;
    const next = addShoppingItems(shopping, match.missing);
    setShopping(saveFoodShopping(next));
  }

  if (guidedRecipe) {
    return (
      <FoodGuidedRecipe
        recipe={guidedRecipe}
        match={guidedMatch}
        onAddMissing={guidedMatch ? () => addMissingToShopping(guidedMatch) : undefined}
        onCancel={() => setGuidedRecipe(null)}
        onComplete={() => {
          logRecipe(guidedRecipe);
          setGuidedRecipe(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <RefreshableScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefreshData={refreshFood}
        >
          <Brand />
          <PillarTabs active="food" />

          <Text style={styles.eyebrow}>PILARES · FOOD</Text>
          <Text style={styles.title}>Come según tu día y lo que realmente tienes.</Text>

          <View style={styles.contextCard}>
            <Text style={styles.contextEyebrow}>AHORA</Text>
            <Text style={styles.contextTitle}>{contextTitle(context)}</Text>
            <Text style={styles.contextCopy}>{contextCopy(context)}</Text>
            {todayShift.type !== 'off'
              ? <Text style={styles.shiftText}>Turno · {todayShift.start}–{todayShift.end}</Text>
              : <Text style={styles.shiftText}>Día libre</Text>}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionInline}>¿QUÉ TIENES DISPONIBLE?</Text>
            <Text style={styles.sectionMeta}>{pantry.length} ingrediente{pantry.length === 1 ? '' : 's'}</Text>
          </View>

          <View style={styles.pantryCard}>
            {pantry.length ? (
              <View style={styles.pantryChips}>
                {pantry.map((item) => (
                  <Pressable key={item.key} style={styles.pantryChip} onPress={() => removePantryItem(item.key)}>
                    <Text style={styles.pantryChipText}>{item.label} ×</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.pantryEmpty}>Escribe lo que tienes en casa. No necesitas cantidades exactas.</Text>
            )}

            {pantryOpen ? (
              <View style={styles.pantryInputBox}>
                <TextInput
                  value={pantryText}
                  onChangeText={setPantryText}
                  placeholder="Ej: huevos, tomate, arroz, pan"
                  placeholderTextColor="#607493"
                  style={styles.input}
                  multiline
                  autoFocus
                />
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                      setPantryOpen(false);
                      setPantryText('');
                    }}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveButton, !parseFoodPantryInput(pantryText).length && styles.saveDisabled]}
                    disabled={!parseFoodPantryInput(pantryText).length}
                    onPress={addPantryText}
                  >
                    <Text style={styles.saveText}>Agregar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.pantryAddButton} onPress={() => setPantryOpen(true)}>
                <Text style={styles.pantryAddText}>+ Agregar ingredientes</Text>
              </Pressable>
            )}

            <FoodPantryPhotoCapture onConfirm={addPhotoPantry} />
          </View>

          <View style={styles.quickActions}>
            <Pressable style={styles.quickButton} onPress={() => router.push('/food-library')}>
              <Text style={styles.quickIcon}>📚</Text>
              <Text style={styles.quickTitle}>Biblioteca</Text>
              <Text style={styles.quickCopy}>{RECIPES.length} recetas</Text>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => router.push('/food-shopping')}>
              <Text style={styles.quickIcon}>🛒</Text>
              <Text style={styles.quickTitle}>Compras</Text>
              <Text style={styles.quickCopy}>{pendingShopping} pendiente{pendingShopping === 1 ? '' : 's'}</Text>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => router.push('/food-prep')}>
              <Text style={styles.quickIcon}>🍱</Text>
              <Text style={styles.quickTitle}>Prep</Text>
              <Text style={styles.quickCopy}>{preparedPortions} porción{preparedPortions === 1 ? '' : 'es'}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.preferenceToggle} onPress={() => setPreferencesOpen((value) => !value)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.preferenceTitle}>Ajustar Food</Text>
              <Text style={styles.preferenceCopy}>
                Hasta {foodPreferences.maxMinutes} min · presupuesto {foodPreferences.budget} · cocina {foodPreferences.cookingEffort}
              </Text>
            </View>
            <Text style={styles.preferenceArrow}>{preferencesOpen ? '−' : '+'}</Text>
          </Pressable>

          {preferencesOpen ? (
            <View style={styles.preferenceCard}>
              <Text style={styles.preferenceLabel}>TIEMPO MÁXIMO PREFERIDO</Text>
              <View style={styles.choiceRow}>
                {([10, 20, 30] as FoodMaxMinutes[]).map((value) => (
                  <Pressable
                    key={value}
                    style={[styles.choice, foodPreferences.maxMinutes === value && styles.choiceActive]}
                    onPress={() => updatePreferences({ maxMinutes: value })}
                  >
                    <Text style={[styles.choiceText, foodPreferences.maxMinutes === value && styles.choiceTextActive]}>
                      {value === 30 ? '30+ min' : `${value} min`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.preferenceLabel}>PRESUPUESTO</Text>
              <View style={styles.choiceRow}>
                {([
                  ['ajustar', 'Ajustar'],
                  ['normal', 'Normal'],
                  ['flexible', 'Flexible'],
                ] as [FoodBudgetPreference, string][]).map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[styles.choice, foodPreferences.budget === value && styles.choiceActive]}
                    onPress={() => updatePreferences({ budget: value })}
                  >
                    <Text style={[styles.choiceText, foodPreferences.budget === value && styles.choiceTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.preferenceLabel}>GANAS DE COCINAR</Text>
              <View style={styles.choiceRow}>
                {([
                  ['minimo', 'Lo mínimo'],
                  ['normal', 'Normal'],
                ] as [FoodCookingEffort, string][]).map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[styles.choice, foodPreferences.cookingEffort === value && styles.choiceActive]}
                    onPress={() => updatePreferences({ cookingEffort: value })}
                  >
                    <Text style={[styles.choiceText, foodPreferences.cookingEffort === value && styles.choiceTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.preferenceHint}>Food usa esto para ordenar propuestas; no oculta recetas ni convierte el presupuesto en un precio exacto.</Text>
            </View>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionInline}>RECETAS VIABLES</Text>
            <Text style={styles.sectionMeta}>según tu día</Text>
          </View>

          <View style={styles.recipeList}>
            {topRecipes.map((match) => (
              <FoodRecipeCard
                key={match.recipe.id}
                match={match}
                onCook={() => setGuidedRecipe(match.recipe)}
                onAddMissing={() => addMissingToShopping(match)}
              />
            ))}
          </View>

          <Pressable style={styles.libraryButton} onPress={() => router.push('/food-library')}>
            <Text style={styles.libraryButtonText}>Ver todas las recetas</Text>
          </Pressable>

          <Text style={styles.section}>HOY</Text>
          {foodDay.entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no has registrado nada.</Text>
              <Text style={styles.emptyCopy}>Food empieza a aprender cuando tú le cuentas; no te persigue para completar casillas.</Text>
            </View>
          ) : (
            <View style={styles.logCard}>
              {foodDay.entries.map((entry, index) => (
                <View key={entry.id} style={[styles.logRow, index === foodDay.entries.length - 1 && styles.logRowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logTime}>{timeLabel(entry.at)}</Text>
                    <Text style={styles.logTitle}>{entry.title}</Text>
                    <Text style={styles.logSource}>{sourceLabel(entry)}</Text>
                  </View>
                  <View style={styles.logActions}>
                    <Pressable onPress={() => setEditingEntry(entry)} style={styles.editTimeButton}>
                      <Text style={styles.editTimeText}>Corregir hora</Text>
                    </Pressable>
                    <Pressable onPress={() => removeEntry(entry.id)} style={styles.removeButton}>
                      <Text style={styles.removeText}>Quitar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!manualOpen ? (
            <Pressable style={styles.manualButton} onPress={() => setManualOpen(true)}>
              <Text style={styles.manualButtonText}>+ Comí otra cosa</Text>
            </Pressable>
          ) : (
            <View style={styles.manualCard}>
              <Text style={styles.manualLabel}>¿Qué comiste?</Text>
              <TextInput
                value={manualText}
                onChangeText={setManualText}
                placeholder="Ej: arroz con pollo"
                placeholderTextColor="#607493"
                style={styles.input}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addManual}
              />
              <View style={styles.inlineActions}>
                <Pressable style={styles.cancelButton} onPress={() => { setManualOpen(false); setManualText(''); }}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.saveButton, !manualText.trim() && styles.saveDisabled]} disabled={!manualText.trim()} onPress={addManual}>
                  <Text style={styles.saveText}>Registrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </RefreshableScrollView>

        <TimeEditModal
          visible={Boolean(editingEntry)}
          title="¿A qué hora comiste esto?"
          description={editingEntry ? `Corregiré solo la hora de “${editingEntry.title}”; el alimento seguirá registrado.` : ''}
          initialTime={editingEntry ? timeLabel(editingEntry.at) : ''}
          onCancel={() => setEditingEntry(null)}
          onSave={correctEntryTime}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboardShell: { flex: 1 },
  content: { padding: 22, paddingBottom: 148 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  contextCard: { marginTop: 12, backgroundColor: '#12304E', borderWidth: 1, borderColor: '#29577D', borderRadius: 24, padding: 18 },
  contextEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  contextTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  contextCopy: { color: '#B8C9DE', fontSize: 14, lineHeight: 21, marginTop: 7 },
  shiftText: { color: '#78AEEC', fontSize: 12, fontWeight: '800', marginTop: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 10, gap: 10 },
  sectionInline: { flex: 1, color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  sectionMeta: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  pantryCard: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 20, padding: 14 },
  pantryEmpty: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  pantryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pantryChip: { borderRadius: 10, borderWidth: 1, borderColor: '#2B5A87', backgroundColor: '#102B4B', paddingHorizontal: 9, paddingVertical: 7 },
  pantryChipText: { color: '#B7D6FA', fontSize: 10, fontWeight: '900' },
  pantryInputBox: { marginTop: 10 },
  pantryAddButton: { marginTop: 10, borderRadius: 13, borderWidth: 1, borderColor: '#356596', minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  pantryAddText: { color: '#91BDF4', fontSize: 11, fontWeight: '900' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#294768', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: colors.text, backgroundColor: colors.surface2, fontSize: 14 },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line },
  cancelText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  saveButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 13, backgroundColor: colors.blue },
  saveDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  quickActions: { flexDirection: 'row', gap: 7, marginTop: 10 },
  quickButton: { flex: 1, minHeight: 92, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 11 },
  quickIcon: { fontSize: 20 },
  quickTitle: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 6 },
  quickCopy: { color: colors.muted, fontSize: 8, marginTop: 2 },
  preferenceToggle: { marginTop: 12, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 13 },
  preferenceTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  preferenceCopy: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  preferenceArrow: { color: '#76AFFF', fontSize: 22, fontWeight: '800' },
  preferenceCard: { marginTop: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  preferenceLabel: { color: '#7898BD', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 9, marginBottom: 7 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 8 },
  choiceActive: { borderColor: '#397EC4', backgroundColor: '#163B68' },
  choiceText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  choiceTextActive: { color: '#FFFFFF' },
  preferenceHint: { color: '#6F849F', fontSize: 9, lineHeight: 14, marginTop: 10 },
  recipeList: { gap: 10 },
  libraryButton: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.line, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  libraryButtonText: { color: '#91BDF4', fontSize: 11, fontWeight: '900' },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 17 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  logCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  logRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  logRowLast: { borderBottomWidth: 0 },
  logTime: { color: '#76AFFF', fontSize: 11, fontWeight: '900' },
  logTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  logSource: { color: colors.muted, fontSize: 11, marginTop: 3 },
  logActions: { alignItems: 'flex-end', gap: 2 },
  editTimeButton: { paddingHorizontal: 8, paddingVertical: 8 },
  editTimeText: { color: '#76AFFF', fontSize: 11, fontWeight: '900' },
  removeButton: { paddingHorizontal: 8, paddingVertical: 8 },
  removeText: { color: '#88A5C7', fontSize: 11, fontWeight: '800' },
  manualButton: { marginTop: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingVertical: 14, alignItems: 'center' },
  manualButtonText: { color: '#91BDF4', fontSize: 13, fontWeight: '900' },
  manualCard: { marginTop: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 16 },
  manualLabel: { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 10 },
});
