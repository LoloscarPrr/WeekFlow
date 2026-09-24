import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { FoodGuidedRecipe } from '@/src/food/FoodGuidedRecipe';
import { addShoppingItems } from '@/src/food/pantry';
import {
  addPreparedMeal,
  consumePreparedMeal,
  createPreparedMeal,
  preparedPortionCount,
  rankFoodReusePairs,
  removePreparedMeal,
  type FoodPreparedMeal,
} from '@/src/food/prep';
import {
  foodMatchLabel,
  foodMissingLabel,
  matchFoodRecipe,
  rankFoodRecipes,
  type FoodRecipeMatch,
} from '@/src/food/recommendations';
import { RECIPES, type FoodRecipe } from '@/src/food/recipes';
import { foodContextForShift } from '@/src/food/suggestions';
import {
  loadDayState,
  loadFoodPantry,
  loadFoodPreferences,
  loadFoodPrepared,
  loadFoodShopping,
  loadWeekState,
  saveFoodEntry,
  saveFoodPrepared,
  saveFoodShopping,
  shiftForDate,
  type FoodPantryItem,
  type FoodPreferences,
  type FoodShoppingItem,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

function preparedDateLabel(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
}

export default function FoodPrepScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [pantry, setPantry] = useState<FoodPantryItem[]>(() => loadFoodPantry());
  const [preferences, setPreferences] = useState<FoodPreferences>(() => loadFoodPreferences());
  const [prepared, setPrepared] = useState<FoodPreparedMeal[]>(() => loadFoodPrepared());
  const [shopping, setShopping] = useState<FoodShoppingItem[]>(() => loadFoodShopping());
  const [guidedRecipe, setGuidedRecipe] = useState<FoodRecipe | null>(null);
  const [prepPortions, setPrepPortions] = useState<2 | 4>(2);

  const now = useMemo(() => new Date(), [dayState, weekState, pantry, preferences, prepared]);
  const shift = useMemo(() => shiftForDate(weekState, now), [now, weekState]);
  const context = useMemo(() => foodContextForShift(now, shift), [now, shift]);
  const lowEnergy = dayState.energy === 'cansado' || dayState.energy === 'agotado';

  const rankedRecipes = useMemo(
    () => rankFoodRecipes(RECIPES, pantry, preferences, { context, lowEnergy }),
    [context, lowEnergy, pantry, preferences],
  );
  const prepCandidates = rankedRecipes.slice(0, 4);
  const reusePairs = useMemo(
    () => rankFoodReusePairs(RECIPES, pantry, preferences, { context, lowEnergy }).slice(0, 3),
    [context, lowEnergy, pantry, preferences],
  );
  const guidedMatch = useMemo(
    () => guidedRecipe
      ? matchFoodRecipe(guidedRecipe, pantry, preferences, { context, lowEnergy })
      : null,
    [context, guidedRecipe, lowEnergy, pantry, preferences],
  );

  useFocusEffect(
    useCallback(() => {
      setDayState(loadDayState());
      setWeekState(loadWeekState());
      setPantry(loadFoodPantry());
      setPreferences(loadFoodPreferences());
      setPrepared(loadFoodPrepared());
      setShopping(loadFoodShopping());
    }, []),
  );

  function persistPrepared(next: FoodPreparedMeal[]) {
    setPrepared(saveFoodPrepared(next));
  }

  function eatPrepared(item: FoodPreparedMeal) {
    const result = consumePreparedMeal(prepared, item.id);
    if (!result.consumed) return;
    persistPrepared(result.items);
    saveFoodEntry({
      id: `${Date.now()}-prepared-${item.recipeId}`,
      at: new Date().toISOString(),
      title: item.title,
      kind: 'meal',
      source: 'prepared',
    });
  }

  function startPrep(recipe: FoodRecipe) {
    setGuidedRecipe(recipe);
  }

  function finishPrep(recipe: FoodRecipe) {
    const meal = createPreparedMeal(recipe, prepPortions);
    if (meal) persistPrepared(addPreparedMeal(prepared, meal));
    setGuidedRecipe(null);
  }

  function addMissing(match: FoodRecipeMatch) {
    if (!match.missing.length) return;
    setShopping(saveFoodShopping(addShoppingItems(shopping, match.missing)));
  }

  if (guidedRecipe) {
    return (
      <FoodGuidedRecipe
        recipe={guidedRecipe}
        mode="prep"
        prepPortions={prepPortions}
        match={guidedMatch}
        onAddMissing={guidedMatch ? () => addMissing(guidedMatch) : undefined}
        onCancel={() => setGuidedRecipe(null)}
        onComplete={() => finishPrep(guidedRecipe)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>
        <PillarTabs active="food" />

        <Text style={styles.eyebrow}>FOOD · PREP</Text>
        <Text style={styles.title}>Cocina una vez. Resuelve más de una comida.</Text>
        <Text style={styles.copy}>
          Guarda porciones que realmente preparaste y reutiliza ingredientes entre recetas. WeekFlow no inventa fechas de caducidad.
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryNumber}>{preparedPortionCount(prepared)}</Text>
            <Text style={styles.summaryLabel}>porciones preparadas</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryNumber}>{prepared.length}</Text>
            <Text style={styles.summaryLabel}>preparaciones</Text>
          </View>
        </View>

        <Text style={styles.section}>YA PREPARADO</Text>
        {prepared.length ? (
          <View style={styles.list}>
            {prepared.map((item) => (
              <View key={item.id} style={styles.preparedCard}>
                <View style={styles.preparedHead}>
                  <Text style={styles.preparedIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.preparedTitle}>{item.title}</Text>
                    <Text style={styles.preparedMeta}>
                      {item.portionsRemaining} porción{item.portionsRemaining === 1 ? '' : 'es'} · preparado {preparedDateLabel(item.preparedAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Pressable style={styles.primarySmall} onPress={() => eatPrepared(item)}>
                    <Text style={styles.primarySmallText}>Comí una porción</Text>
                  </Pressable>
                  <Pressable style={styles.secondarySmall} onPress={() => persistPrepared(removePreparedMeal(prepared, item.id))}>
                    <Text style={styles.secondarySmallText}>Quitar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no tienes porciones preparadas.</Text>
            <Text style={styles.emptyCopy}>Elige una receta abajo y hazla en modo Prep. Nada se contará como comido hasta que tú lo registres.</Text>
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionInline}>PREPARAR PARA DESPUÉS</Text>
          <View style={styles.portionChoices}>
            {([2, 4] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.portionChoice, prepPortions === value && styles.portionChoiceActive]}
                onPress={() => setPrepPortions(value)}
              >
                <Text style={[styles.portionChoiceText, prepPortions === value && styles.portionChoiceTextActive]}>
                  {value} porciones
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.list}>
          {prepCandidates.map((match) => (
            <View key={match.recipe.id} style={styles.recipeCard}>
              <View style={styles.recipeHead}>
                <Text style={styles.recipeIcon}>{match.recipe.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeTitle}>{match.recipe.title}</Text>
                  <Text style={styles.recipeMeta}>
                    {match.recipe.minutes} min · {foodMatchLabel(match)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.missing, !match.missing.length && styles.ready]}>
                {foodMissingLabel(match)}
              </Text>
              <View style={styles.cardActions}>
                <Pressable style={styles.primarySmall} onPress={() => startPrep(match.recipe)}>
                  <Text style={styles.primarySmallText}>Preparar {prepPortions}</Text>
                </Pressable>
                {match.missing.length ? (
                  <Pressable style={styles.secondarySmall} onPress={() => addMissing(match)}>
                    <Text style={styles.secondarySmallText}>+ Compras</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>REUTILIZAR INGREDIENTES</Text>
        {reusePairs.length ? (
          <View style={styles.list}>
            {reusePairs.map((pair) => (
              <View key={`${pair.first.recipe.id}-${pair.second.recipe.id}`} style={styles.reuseCard}>
                <Text style={styles.reuseEyebrow}>COMPARTEN {pair.sharedIngredients.length} INGREDIENTE{pair.sharedIngredients.length === 1 ? '' : 'S'}</Text>
                <Text style={styles.reuseTitle}>{pair.first.recipe.title}</Text>
                <Text style={styles.reusePlus}>+</Text>
                <Text style={styles.reuseTitle}>{pair.second.recipe.title}</Text>
                <Text style={styles.reuseShared}>
                  Reutilizan: {pair.sharedIngredients.map((item) => item.name).join(', ')}
                </Text>
                <Text style={styles.reuseMissing}>
                  {pair.missingKeys.length
                    ? `${pair.missingKeys.length} ingrediente${pair.missingKeys.length === 1 ? '' : 's'} faltante${pair.missingKeys.length === 1 ? '' : 's'} entre ambas`
                    : 'Con tu despensa actual no falta ningún ingrediente esencial entre ambas.'}
                </Text>
                <View style={styles.cardActions}>
                  <Pressable style={styles.secondarySmall} onPress={() => startPrep(pair.first.recipe)}>
                    <Text style={styles.secondarySmallText}>Preparar primera</Text>
                  </Pressable>
                  <Pressable style={styles.secondarySmall} onPress={() => startPrep(pair.second.recipe)}>
                    <Text style={styles.secondarySmallText}>Preparar segunda</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no hay una pareja útil.</Text>
            <Text style={styles.emptyCopy}>Cuando tu despensa tenga más ingredientes, Food buscará recetas que compartan bases reales.</Text>
          </View>
        )}

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Sobre las porciones guardadas</Text>
          <Text style={styles.safetyCopy}>
            WeekFlow recuerda cuántas porciones dijiste que preparaste y cuándo. No determina si un alimento sigue apto para consumo ni reemplaza tus prácticas habituales de conservación.
          </Text>
        </View>
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
  summary: { flexDirection: 'row', gap: 10, marginTop: 18 },
  summaryCell: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  summaryNumber: { color: colors.text, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 2 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 28, marginBottom: 10 },
  sectionHead: { marginTop: 28, marginBottom: 10, gap: 9 },
  sectionInline: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12 },
  portionChoices: { flexDirection: 'row', gap: 7 },
  portionChoice: { borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 7 },
  portionChoiceActive: { borderColor: '#397EC4', backgroundColor: '#163B68' },
  portionChoiceText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  portionChoiceTextActive: { color: '#FFFFFF' },
  list: { gap: 9 },
  preparedCard: { borderRadius: 20, borderWidth: 1, borderColor: '#347363', backgroundColor: '#12332C', padding: 14 },
  preparedHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  preparedIcon: { fontSize: 30 },
  preparedTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  preparedMeta: { color: '#8FC9B9', fontSize: 9, marginTop: 3 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  primarySmall: { borderRadius: 11, backgroundColor: colors.blue, paddingHorizontal: 11, paddingVertical: 9 },
  primarySmallText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  secondarySmall: { borderRadius: 11, borderWidth: 1, borderColor: '#356596', backgroundColor: '#112C4B', paddingHorizontal: 11, paddingVertical: 9 },
  secondarySmallText: { color: '#A9CEFA', fontSize: 10, fontWeight: '900' },
  emptyCard: { borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 15 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  recipeCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  recipeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recipeIcon: { fontSize: 28 },
  recipeTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  recipeMeta: { color: '#7890AE', fontSize: 9, fontWeight: '800', marginTop: 3 },
  missing: { color: '#E5C779', fontSize: 10, lineHeight: 15, marginTop: 8 },
  ready: { color: '#8CE0C7' },
  reuseCard: { borderRadius: 20, borderWidth: 1, borderColor: '#315E8B', backgroundColor: '#0F2742', padding: 14 },
  reuseEyebrow: { color: '#76AFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  reuseTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 7 },
  reusePlus: { color: '#7898BD', fontSize: 12, fontWeight: '900', marginTop: 2 },
  reuseShared: { color: '#8CE0C7', fontSize: 10, lineHeight: 15, marginTop: 9 },
  reuseMissing: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  safetyCard: { marginTop: 24, borderRadius: 18, borderWidth: 1, borderColor: '#514C3A', backgroundColor: '#29261C', padding: 14 },
  safetyTitle: { color: '#E5D7A7', fontSize: 11, fontWeight: '900' },
  safetyCopy: { color: '#BDB494', fontSize: 9, lineHeight: 15, marginTop: 5 },
});
