import {
  confirmedPhotoPantryItems,
  foodPhotoCandidatesFromOcr,
  foodPhotoCandidatesFromText,
} from '../src/food/photoPantry';
import { DEFAULT_FOOD_PREFERENCES, parseFoodPantryInput } from '../src/food/pantry';
import {
  addPreparedMeal,
  consumePreparedMeal,
  createPreparedMeal,
  preparedPortionCount,
  rankFoodReusePairs,
  removePreparedMeal,
  sanitizeFoodPrepared,
} from '../src/food/prep';
import type { FoodRecipe } from '../src/food/recipes';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(message + ': esperaba ' + String(expected) + ', recibí ' + String(actual));
  }
}

const photo = foodPhotoCandidatesFromText('HUEVOS arroz ATÚN detergente tomates');
equal(photo.length, 4, 'foto reconoce cuatro ingredientes conocidos');
ok(photo.some((item) => item.key === 'huevo'), 'foto reconoce huevo');
ok(photo.some((item) => item.key === 'arroz'), 'foto reconoce arroz');
ok(photo.some((item) => item.key === 'atun'), 'foto reconoce atún');
ok(photo.some((item) => item.key === 'tomate'), 'foto reconoce tomate');
ok(!photo.some((item) => item.key === 'detergente'), 'foto no convierte texto desconocido en comida');

const ocr = foodPhotoCandidatesFromOcr({
  text: 'LECHE y AVENA',
  blocks: [{ text: 'LECHE', lines: [{ text: 'AVENA', elements: [] }] }],
});
equal(ocr.length, 2, 'OCR duplicado no duplica candidatos');
ok(ocr.some((item) => item.key === 'leche'), 'OCR reconoce leche');
ok(ocr.some((item) => item.key === 'avena'), 'OCR reconoce avena');

const confirmed = confirmedPhotoPantryItems(
  foodPhotoCandidatesFromText('huevos arroz'),
  ['huevo'],
  'tomate, huevo',
);
equal(confirmed.length, 2, 'revisión mezcla selección y texto manual sin duplicados');
ok(confirmed.some((item) => item.key === 'huevo'), 'revisión conserva seleccionado');
ok(confirmed.some((item) => item.key === 'tomate'), 'revisión agrega manual');
ok(!confirmed.some((item) => item.key === 'arroz'), 'candidato desmarcado no se confirma');

equal(sanitizeFoodPrepared(undefined).length, 0, 'legacy prep parte vacío');
equal(sanitizeFoodPrepared([{
  id: 'bad', recipeId: 'x', title: 'x', icon: 'x', portionsRemaining: 0, preparedAt: new Date().toISOString(),
}]).length, 0, 'prep descarta porciones cero');

const recipe = { id: 'test', title: 'Prueba', icon: '🍲' };
const meal = createPreparedMeal(recipe, 2, new Date('2026-09-24T04:00:00Z'), 'prep-1');
ok(meal, 'crea preparación válida');
equal(meal!.portionsRemaining, 2, 'guarda porciones declaradas');

let prepared = addPreparedMeal([], meal!);
equal(preparedPortionCount(prepared), 2, 'cuenta porciones preparadas');
let consumed = consumePreparedMeal(prepared, 'prep-1');
ok(consumed.consumed, 'consumo encuentra preparación');
equal(consumed.items.length, 1, 'primera porción conserva preparación');
equal(consumed.items[0].portionsRemaining, 1, 'primera porción decrementa');
consumed = consumePreparedMeal(consumed.items, 'prep-1');
equal(consumed.items.length, 0, 'última porción elimina preparación');

prepared = addPreparedMeal([], meal!);
prepared = removePreparedMeal(prepared, 'prep-1');
equal(prepared.length, 0, 'quitar preparación elimina sin consumo');

const base = {
  icon: '🍽️',
  minutes: 10,
  portions: 1,
  difficulty: 'Fácil' as const,
  substitutions: [],
  steps: ['Listo'],
  contexts: ['free' as const],
  costTier: 1 as const,
  prepLevel: 'minimo' as const,
};
const first: FoodRecipe = {
  ...base,
  id: 'first',
  title: 'Arroz con huevo',
  ingredients: [
    { key: 'arroz', name: 'Arroz', amount: '1 taza' },
    { key: 'huevo', name: 'Huevo', amount: '1' },
  ],
};
const second: FoodRecipe = {
  ...base,
  id: 'second',
  title: 'Arroz con tomate',
  ingredients: [
    { key: 'arroz', name: 'Arroz', amount: '1 taza' },
    { key: 'tomate', name: 'Tomate', amount: '1' },
  ],
};
const unrelated: FoodRecipe = {
  ...base,
  id: 'third',
  title: 'Yogur',
  ingredients: [{ key: 'yogur', name: 'Yogur', amount: '1' }],
};

const pairs = rankFoodReusePairs(
  [first, second, unrelated],
  parseFoodPantryInput('arroz, huevo, tomate, yogur'),
  DEFAULT_FOOD_PREFERENCES,
  { context: 'free', lowEnergy: false },
);
equal(pairs.length, 1, 'reutilización solo empareja recetas con ingrediente esencial compartido');
equal(pairs[0].sharedIngredients.length, 1, 'pareja informa ingrediente compartido');
equal(pairs[0].sharedIngredients[0].key, 'arroz', 'pareja comparte arroz');
ok(pairs[0].first.recipe.id !== pairs[0].second.recipe.id, 'nunca empareja receta consigo misma');

console.log('Food photo pantry and prep regression tests passed.');
