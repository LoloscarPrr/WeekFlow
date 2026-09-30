import {
  DEFAULT_FOOD_PREFERENCES,
  addShoppingItems,
  mergeFoodPantry,
  parseFoodPantryInput,
  sanitizeFoodPantry,
  sanitizeFoodPreferences,
  sanitizeFoodShopping,
  type FoodPreferences,
} from '../src/food/pantry';
import {
  matchFoodRecipe,
  rankFoodRecipes,
  recentFoodRecipeConsumptions,
} from '../src/food/recommendations';
import {
  RECIPES,
  type FoodRecipe,
} from '../src/food/recipes';
import type { FoodDayRecord } from '../src/food/history';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

equal(sanitizeFoodPantry(undefined).length, 0, 'legacy parte con despensa vacía');
equal(sanitizeFoodShopping(undefined).length, 0, 'legacy parte con compras vacías');
equal(sanitizeFoodPreferences(undefined).maxMinutes, DEFAULT_FOOD_PREFERENCES.maxMinutes, 'legacy usa tiempo default');
equal(sanitizeFoodPreferences(undefined).budget, 'normal', 'legacy usa presupuesto normal');
equal(sanitizeFoodPreferences(undefined).cookingEffort, 'normal', 'legacy usa esfuerzo normal');

const parsed = parseFoodPantryInput('huevos, tomate, arroz, HUEVO\nTomates');
equal(parsed.length, 3, 'normaliza plural y duplicados');
equal(parsed[0].key, 'huevo', 'huevos canoniza a huevo');
ok(parsed.some((item) => item.key === 'tomate'), 'tomate presente');
ok(parsed.some((item) => item.key === 'arroz'), 'arroz presente');

const merged = mergeFoodPantry(
  parseFoodPantryInput('huevo, arroz'),
  parseFoodPantryInput('tomate, arroz'),
);
equal(merged.length, 3, 'merge no duplica');

ok(RECIPES.length >= 10, 'biblioteca Food tiene al menos 10 recetas guiables');
for (const recipe of RECIPES) {
  ok(recipe.ingredients.length > 0, `${recipe.id} tiene ingredientes`);
  for (const ingredient of recipe.ingredients) {
    ok(Boolean(ingredient.key), `${recipe.id} usa key canónica`);
    ok(Boolean(ingredient.name), `${recipe.id} tiene nombre visible`);
  }
  ok(!('calories' in recipe), `${recipe.id} no introduce calorías`);
  ok(!('macros' in recipe), `${recipe.id} no introduce macros`);
}

const eggRecipe = RECIPES.find((item) => item.id === 'egg-tomato-toast');
ok(eggRecipe, 'receta huevo existe');
const match = matchFoodRecipe(
  eggRecipe!,
  parseFoodPantryInput('huevo, pan'),
  DEFAULT_FOOD_PREFERENCES,
  { context: 'free', lowEnergy: false },
);
equal(match.owned.filter((item) => !item.optional).length, 2, 'match separa ingredientes que tengo');
equal(match.missing.length, 1, 'match detecta faltante esencial');
equal(match.missing[0].key, 'tomate', 'tomate es faltante');
ok(match.optionalMissing.some((item) => item.key === 'aceite'), 'aceite opcional no bloquea');

const pantry = parseFoodPantryInput('pan, queso, fruta');
const ranked = rankFoodRecipes(
  RECIPES,
  pantry,
  DEFAULT_FOOD_PREFERENCES,
  { context: 'working', lowEnergy: false },
);
const sandwichIndex = ranked.findIndex((item) => item.recipe.id === 'simple-sandwich');
const chickenIndex = ranked.findIndex((item) => item.recipe.id === 'chicken-potato-pan');
ok(sandwichIndex >= 0 && chickenIndex >= 0, 'ranking contiene recetas');
ok(sandwichIndex < chickenIndex, 'ranking favorece receta con menos faltantes/contexto adecuado');

const baseRecipe: FoodRecipe = {
  id: 'test-normal',
  icon: '•',
  title: 'Normal',
  minutes: 15,
  portions: 1,
  difficulty: 'Fácil',
  ingredients: [{ key: 'arroz', name: 'Arroz', amount: '1 taza' }],
  substitutions: [],
  steps: ['Listo'],
  contexts: ['free'],
  costTier: 1,
  prepLevel: 'normal',
};
const minimalRecipe: FoodRecipe = { ...baseRecipe, id: 'test-minimal', title: 'Mínimo', prepLevel: 'minimo' };
const fullPantry = parseFoodPantryInput('arroz');
const normalLow = matchFoodRecipe(baseRecipe, fullPantry, DEFAULT_FOOD_PREFERENCES, { context: 'free', lowEnergy: true });
const minimalLow = matchFoodRecipe(minimalRecipe, fullPantry, DEFAULT_FOOD_PREFERENCES, { context: 'free', lowEnergy: true });
ok(minimalLow.score > normalLow.score, 'energía baja favorece preparación mínima');

const fastRecipe: FoodRecipe = { ...minimalRecipe, id: 'fast', title: 'Rápida', minutes: 8 };
const slowRecipe: FoodRecipe = { ...minimalRecipe, id: 'slow', title: 'Lenta', minutes: 28 };
const tenMinutes: FoodPreferences = { ...DEFAULT_FOOD_PREFERENCES, maxMinutes: 10 };
const fastScore = matchFoodRecipe(fastRecipe, fullPantry, tenMinutes, { context: 'free', lowEnergy: false }).score;
const slowScore = matchFoodRecipe(slowRecipe, fullPantry, tenMinutes, { context: 'free', lowEnergy: false }).score;
ok(fastScore > slowScore, 'tiempo máximo reduce prioridad de receta larga');

const equalA: FoodRecipe = { ...baseRecipe, id: 'equal-a', title: 'Arroz A' };
const equalB: FoodRecipe = { ...baseRecipe, id: 'equal-b', title: 'Arroz B' };
const withoutHistory = rankFoodRecipes(
  [equalA, equalB],
  fullPantry,
  DEFAULT_FOOD_PREFERENCES,
  { context: 'free', lowEnergy: false },
);
equal(withoutHistory[0].recipe.id, 'equal-a', 'sin historial conserva desempate base por título');

const recentToday = [{ title: 'Arroz A', daysAgo: 0 }];
const withRecentToday = rankFoodRecipes(
  [equalA, equalB],
  fullPantry,
  DEFAULT_FOOD_PREFERENCES,
  { context: 'free', lowEnergy: false, recentConsumptions: recentToday },
);
equal(withRecentToday[0].recipe.id, 'equal-b', 'receta consumida hoy baja frente a alternativa comparable');
equal(withRecentToday.length, 2, 'repetición baja prioridad pero no oculta recetas');

const todayPenaltyScore = matchFoodRecipe(equalA, fullPantry, DEFAULT_FOOD_PREFERENCES, {
  context: 'free', lowEnergy: false, recentConsumptions: [{ title: 'Arroz A', daysAgo: 0 }],
}).score;
const oldPenaltyScore = matchFoodRecipe(equalA, fullPantry, DEFAULT_FOOD_PREFERENCES, {
  context: 'free', lowEnergy: false, recentConsumptions: [{ title: 'Arroz A', daysAgo: 5 }],
}).score;
ok(oldPenaltyScore > todayPenaltyScore, 'consumo antiguo penaliza menos que consumo de hoy');

const clearlyViable: FoodRecipe = { ...baseRecipe, id: 'clear', title: 'Clara' };
const poorAlternative: FoodRecipe = {
  ...baseRecipe,
  id: 'poor',
  title: 'Alternativa',
  ingredients: [
    { key: 'arroz', name: 'Arroz', amount: '1 taza' },
    { key: 'pollo', name: 'Pollo', amount: '1' },
    { key: 'tomate', name: 'Tomate', amount: '1' },
  ],
};
const viabilityWins = rankFoodRecipes(
  [clearlyViable, poorAlternative],
  fullPantry,
  DEFAULT_FOOD_PREFERENCES,
  { context: 'free', lowEnergy: false, recentConsumptions: [{ title: 'Clara', daysAgo: 0 }] },
);
equal(viabilityWins[0].recipe.id, 'clear', 'ventaja clara de despensa puede superar penalización de repetición');

const history: FoodDayRecord[] = [
  {
    date: '2026-09-30',
    entries: [
      { id: 'r1', at: '2026-09-30T12:00:00.000Z', title: equalA.title, kind: 'meal', source: 'recipe' },
      { id: 'm1', at: '2026-09-30T13:00:00.000Z', title: equalB.title, kind: 'other', source: 'manual' },
    ],
  },
  {
    date: '2026-09-28',
    entries: [
      { id: 'p1', at: '2026-09-28T12:00:00.000Z', title: equalB.title, kind: 'meal', source: 'prepared' },
    ],
  },
  {
    date: '2026-09-20',
    entries: [
      { id: 'old', at: '2026-09-20T12:00:00.000Z', title: equalA.title, kind: 'meal', source: 'suggestion' },
    ],
  },
];
const recent = recentFoodRecipeConsumptions(history, [equalA, equalB], '2026-09-30');
equal(recent.length, 2, 'solo consumos no manuales dentro de siete días alimentan recencia');
ok(recent.some((item) => item.title === equalA.title && item.daysAgo === 0), 'receta de hoy se conserva como recencia 0');
ok(recent.some((item) => item.title === equalB.title && item.daysAgo === 2), 'porción preparada también alimenta recencia');
ok(!recent.some((item) => item.title === equalB.title && item.daysAgo === 0), 'entrada manual con mismo título no penaliza receta');

const shoppingOnce = addShoppingItems([], [
  { key: 'tomate', name: 'Tomate' },
  { key: 'huevo', name: 'Huevo' },
], new Date('2026-09-23T12:00:00Z'));
const shoppingTwice = addShoppingItems(shoppingOnce, [
  { key: 'tomates', name: 'Tomates' },
  { key: 'huevo', name: 'Huevos' },
], new Date('2026-09-23T13:00:00Z'));
equal(shoppingTwice.length, 2, 'compras no duplica keys equivalentes');
equal(shoppingTwice.filter((item) => item.key === 'tomate').length, 1, 'tomate aparece una vez');

const sanitizedShopping = sanitizeFoodShopping([
  ...shoppingTwice,
  { key: 'tomate', label: 'Tomate duplicado', checked: true, addedAt: 'x' },
]);
equal(sanitizedShopping.length, 2, 'sanitización también elimina duplicados');

console.log('Food pantry, recommendation and shopping regression tests passed.');
