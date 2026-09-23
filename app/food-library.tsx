import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { FoodGuidedRecipe } from '@/src/food/FoodGuidedRecipe';
import { FoodRecipeCard } from '@/src/food/FoodRecipeCard';
import { addShoppingItems } from '@/src/food/pantry';
import { matchFoodRecipe, rankFoodRecipes, type FoodRecipeMatch } from '@/src/food/recommendations';
import { RECIPES, type FoodRecipe } from '@/src/food/recipes';
import { foodContextForShift } from '@/src/food/suggestions';
import {
  loadDayState,
  loadFoodPantry,
  loadFoodPreferences,
  loadFoodShopping,
  loadWeekState,
  saveFoodEntry,
  saveFoodShopping,
  shiftForDate,
  type FoodPantryItem,
  type FoodPreferences,
  type FoodShoppingItem,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

export default function FoodLibraryScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [pantry, setPantry] = useState<FoodPantryItem[]>(() => loadFoodPantry());
  const [preferences, setPreferences] = useState<FoodPreferences>(() => loadFoodPreferences());
  const [shopping, setShopping] = useState<FoodShoppingItem[]>(() => loadFoodShopping());
  const [query, setQuery] = useState('');
  const [readyOnly, setReadyOnly] = useState(false);
  const [guidedRecipe, setGuidedRecipe] = useState<FoodRecipe | null>(null);

  const now = useMemo(() => new Date(), [dayState, weekState, pantry, preferences]);
  const shift = useMemo(() => shiftForDate(weekState, now), [now, weekState]);
  const context = useMemo(() => foodContextForShift(now, shift), [now, shift]);
  const lowEnergy = dayState.energy === 'cansado' || dayState.energy === 'agotado';

  const ranked = useMemo(
    () => rankFoodRecipes(RECIPES, pantry, preferences, { context, lowEnergy }),
    [context, lowEnergy, pantry, preferences],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ranked.filter((match) => {
      if (readyOnly && match.missing.length) return false;
      if (!needle) return true;
      const haystack = [
        match.recipe.title,
        ...match.recipe.ingredients.map((item) => item.name),
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, ranked, readyOnly]);

  const guidedMatch = useMemo(
    () => guidedRecipe ? matchFoodRecipe(guidedRecipe, pantry, preferences, { context, lowEnergy }) : null,
    [context, guidedRecipe, lowEnergy, pantry, preferences],
  );

  useFocusEffect(
    useCallback(() => {
      setDayState(loadDayState());
      setWeekState(loadWeekState());
      setPantry(loadFoodPantry());
      setPreferences(loadFoodPreferences());
      setShopping(loadFoodShopping());
    }, []),
  );

  function addMissing(match: FoodRecipeMatch) {
    setShopping(saveFoodShopping(addShoppingItems(shopping, match.missing)));
  }

  function logRecipe(recipe: FoodRecipe) {
    saveFoodEntry({
      id: `${Date.now()}-${recipe.id}`,
      at: new Date().toISOString(),
      title: recipe.title,
      kind: 'meal',
      source: 'recipe',
    });
  }

  if (guidedRecipe) {
    return (
      <FoodGuidedRecipe
        recipe={guidedRecipe}
        match={guidedMatch}
        onAddMissing={guidedMatch ? () => addMissing(guidedMatch) : undefined}
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>
        <PillarTabs active="food" />

        <Text style={styles.eyebrow}>FOOD · BIBLIOTECA</Text>
        <Text style={styles.title}>Recetas que parten de lo que tienes.</Text>
        <Text style={styles.copy}>
          Se ordenan por despensa, tiempo, energía, turno y tus preferencias. Una receta con faltantes sigue visible para que puedas decidir.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar receta o ingrediente"
          placeholderTextColor="#607493"
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[styles.readyToggle, readyOnly && styles.readyToggleActive]}
          onPress={() => setReadyOnly((value) => !value)}
        >
          <Text style={[styles.readyText, readyOnly && styles.readyTextActive]}>
            {readyOnly ? '✓ Solo recetas listas con mi despensa' : '○ Mostrar solo recetas listas con mi despensa'}
          </Text>
        </Pressable>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{filtered.length} recetas</Text>
          <Text style={styles.meta}>{pantry.length} ingredientes registrados</Text>
        </View>

        <View style={styles.list}>
          {filtered.map((match) => (
            <FoodRecipeCard
              key={match.recipe.id}
              match={match}
              onCook={() => setGuidedRecipe(match.recipe)}
              onAddMissing={() => addMissing(match)}
            />
          ))}
        </View>

        {!filtered.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No encontré recetas con ese filtro.</Text>
            <Text style={styles.emptyCopy}>Prueba otra búsqueda o vuelve a mostrar recetas con faltantes.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 150 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backButton: { borderRadius: 13, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 9 },
  backText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 26 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 7 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  search: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 14, fontSize: 14, marginTop: 18 },
  readyToggle: { marginTop: 10, minHeight: 44, justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 13 },
  readyToggleActive: { borderColor: '#347363', backgroundColor: '#153A31' },
  readyText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  readyTextActive: { color: '#8CE0C7' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 15, marginBottom: 9 },
  meta: { color: '#7890AE', fontSize: 9, fontWeight: '900' },
  list: { gap: 10 },
  empty: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 17 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  emptyCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
});
