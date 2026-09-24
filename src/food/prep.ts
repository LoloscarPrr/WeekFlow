import type { FoodPantryItem, FoodPreferences } from './pantry';
import {
  matchFoodRecipe,
  type FoodRecipeMatch,
} from './recommendations';
import type { FoodContext } from './suggestions';
import type { FoodRecipe, FoodRecipeIngredient } from './recipes';

export type FoodPreparedMeal = {
  id: string;
  recipeId: string;
  title: string;
  icon: string;
  portionsRemaining: number;
  preparedAt: string;
};

export type FoodPreparedConsumption = {
  items: FoodPreparedMeal[];
  consumed: FoodPreparedMeal | null;
};

export type FoodReusePair = {
  first: FoodRecipeMatch;
  second: FoodRecipeMatch;
  sharedIngredients: FoodRecipeIngredient[];
  missingKeys: string[];
  score: number;
};

export function sanitizeFoodPrepared(value: unknown): FoodPreparedMeal[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: FoodPreparedMeal[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const raw = candidate as Partial<FoodPreparedMeal>;
    if (
      typeof raw.id !== 'string'
      || !raw.id.trim()
      || seen.has(raw.id)
      || typeof raw.recipeId !== 'string'
      || !raw.recipeId.trim()
      || typeof raw.title !== 'string'
      || !raw.title.trim()
      || typeof raw.portionsRemaining !== 'number'
      || !Number.isInteger(raw.portionsRemaining)
      || raw.portionsRemaining <= 0
    ) continue;

    seen.add(raw.id);
    result.push({
      id: raw.id,
      recipeId: raw.recipeId,
      title: raw.title.trim(),
      icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon : '🍽️',
      portionsRemaining: Math.min(raw.portionsRemaining, 50),
      preparedAt: typeof raw.preparedAt === 'string' && !Number.isNaN(Date.parse(raw.preparedAt))
        ? raw.preparedAt
        : new Date(0).toISOString(),
    });
  }

  return result.sort((a, b) => b.preparedAt.localeCompare(a.preparedAt));
}

export function createPreparedMeal(
  recipe: Pick<FoodRecipe, 'id' | 'title' | 'icon'>,
  portions: number,
  now = new Date(),
  id = `${now.getTime()}-${recipe.id}`,
): FoodPreparedMeal | null {
  if (!Number.isInteger(portions) || portions <= 0) return null;
  return {
    id,
    recipeId: recipe.id,
    title: recipe.title,
    icon: recipe.icon,
    portionsRemaining: Math.min(portions, 50),
    preparedAt: now.toISOString(),
  };
}

export function addPreparedMeal(current: FoodPreparedMeal[], meal: FoodPreparedMeal) {
  return sanitizeFoodPrepared([meal, ...current.filter((item) => item.id !== meal.id)]);
}

export function consumePreparedMeal(
  current: FoodPreparedMeal[],
  id: string,
): FoodPreparedConsumption {
  const target = current.find((item) => item.id === id) ?? null;
  if (!target) return { items: current, consumed: null };

  const items = target.portionsRemaining <= 1
    ? current.filter((item) => item.id !== id)
    : current.map((item) => item.id === id
      ? { ...item, portionsRemaining: item.portionsRemaining - 1 }
      : item);

  return {
    items: sanitizeFoodPrepared(items),
    consumed: target,
  };
}

export function removePreparedMeal(current: FoodPreparedMeal[], id: string) {
  return sanitizeFoodPrepared(current.filter((item) => item.id !== id));
}

export function preparedPortionCount(items: FoodPreparedMeal[]) {
  return items.reduce((total, item) => total + item.portionsRemaining, 0);
}

function requiredIngredients(recipe: FoodRecipe) {
  return recipe.ingredients.filter((item) => !item.optional);
}

export function rankFoodReusePairs(
  recipes: FoodRecipe[],
  pantry: FoodPantryItem[],
  preferences: FoodPreferences,
  options: { context: FoodContext; lowEnergy: boolean },
): FoodReusePair[] {
  const matches = recipes.map((recipe) =>
    matchFoodRecipe(recipe, pantry, preferences, options)
  );
  const result: FoodReusePair[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    for (let j = i + 1; j < matches.length; j += 1) {
      const first = matches[i];
      const second = matches[j];
      if (first.recipe.id === second.recipe.id) continue;

      const secondRequired = new Map(
        requiredIngredients(second.recipe).map((item) => [item.key, item]),
      );
      const sharedIngredients = requiredIngredients(first.recipe)
        .filter((item) => secondRequired.has(item.key));

      if (!sharedIngredients.length) continue;

      const missingKeys = [...new Set([
        ...first.missing.map((item) => item.key),
        ...second.missing.map((item) => item.key),
      ])];

      const score = (
        sharedIngredients.length * 45
        - missingKeys.length * 22
        + (first.score + second.score) * 0.12
        - Math.abs(first.recipe.minutes - second.recipe.minutes) * 0.2
      );

      result.push({
        first,
        second,
        sharedIngredients,
        missingKeys,
        score,
      });
    }
  }

  return result.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.sharedIngredients.length !== a.sharedIngredients.length) {
      return b.sharedIngredients.length - a.sharedIngredients.length;
    }
    if (a.missingKeys.length !== b.missingKeys.length) {
      return a.missingKeys.length - b.missingKeys.length;
    }
    return a.first.recipe.title.localeCompare(b.first.recipe.title, 'es');
  });
}
