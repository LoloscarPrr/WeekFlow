import type { FoodDayRecord } from './history';
import type { FoodContext } from './suggestions';
import type { FoodPantryItem, FoodPreferences } from './pantry';
import type { FoodRecipe, FoodRecipeIngredient } from './recipes';

export type FoodRecipeFit = 'listo' | 'casi' | 'compras';

export type FoodRecentConsumption = {
  title: string;
  daysAgo: number;
};

export type FoodRecipeMatch = {
  recipe: FoodRecipe;
  owned: FoodRecipeIngredient[];
  missing: FoodRecipeIngredient[];
  optionalMissing: FoodRecipeIngredient[];
  pantryCoverage: number;
  estimatedFit: FoodRecipeFit;
  score: number;
};

function normalizeRecipeTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .trim();
}

function dateKeyUtcMs(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return ms;
}

export function recentFoodRecipeConsumptions(
  history: FoodDayRecord[],
  recipes: FoodRecipe[],
  referenceDateKey: string,
  maxDays = 7,
): FoodRecentConsumption[] {
  const referenceMs = dateKeyUtcMs(referenceDateKey);
  if (referenceMs === null || maxDays < 0) return [];

  const recipeTitles = new Set(recipes.map((recipe) => normalizeRecipeTitle(recipe.title)));
  const result: FoodRecentConsumption[] = [];

  for (const day of history) {
    const dayMs = dateKeyUtcMs(day.date);
    if (dayMs === null) continue;
    const daysAgo = Math.round((referenceMs - dayMs) / 86_400_000);
    if (daysAgo < 0 || daysAgo > maxDays) continue;

    for (const entry of day.entries) {
      if (entry.source === 'manual') continue;
      const title = normalizeRecipeTitle(entry.title);
      if (!recipeTitles.has(title)) continue;
      result.push({ title, daysAgo });
    }
  }

  return result;
}

function recentRepeatPenalty(recipe: FoodRecipe, recent: FoodRecentConsumption[] = []) {
  const recipeTitle = normalizeRecipeTitle(recipe.title);
  let penalty = 0;
  for (const item of recent) {
    if (normalizeRecipeTitle(item.title) !== recipeTitle) continue;
    const daysAgo = Number.isFinite(item.daysAgo) ? Math.max(0, Math.floor(item.daysAgo)) : 99;
    if (daysAgo === 0) penalty += 32;
    else if (daysAgo === 1) penalty += 24;
    else if (daysAgo === 2) penalty += 16;
    else if (daysAgo === 3) penalty += 10;
    else if (daysAgo <= 5) penalty += 6;
    else if (daysAgo <= 7) penalty += 2;
  }
  return Math.min(48, penalty);
}

function budgetPenalty(recipe: FoodRecipe, preferences: FoodPreferences) {
  if (preferences.budget === 'flexible') return 0;
  if (preferences.budget === 'normal') return recipe.costTier === 3 ? 8 : 0;
  return recipe.costTier === 1 ? 0 : recipe.costTier === 2 ? 8 : 18;
}

function contextBonus(recipe: FoodRecipe, context: FoodContext) {
  if (recipe.contexts.includes('any')) return 10;
  return recipe.contexts.includes(context) ? 18 : 0;
}

export function matchFoodRecipe(
  recipe: FoodRecipe,
  pantry: FoodPantryItem[],
  preferences: FoodPreferences,
  options: { context: FoodContext; lowEnergy: boolean; recentConsumptions?: FoodRecentConsumption[] },
): FoodRecipeMatch {
  const pantryKeys = new Set(pantry.map((item) => item.key));
  const owned: FoodRecipeIngredient[] = [];
  const missing: FoodRecipeIngredient[] = [];
  const optionalMissing: FoodRecipeIngredient[] = [];

  for (const ingredient of recipe.ingredients) {
    if (pantryKeys.has(ingredient.key)) owned.push(ingredient);
    else if (ingredient.optional) optionalMissing.push(ingredient);
    else missing.push(ingredient);
  }

  const required = recipe.ingredients.filter((item) => !item.optional);
  const ownedRequired = required.filter((item) => pantryKeys.has(item.key)).length;
  const pantryCoverage = required.length === 0 ? 1 : ownedRequired / required.length;
  const estimatedFit: FoodRecipeFit = missing.length === 0
    ? 'listo'
    : missing.length === 1
      ? 'casi'
      : 'compras';

  let score = pantryCoverage * 100;
  score -= missing.length * 24;
  score -= optionalMissing.length * 2;
  score += contextBonus(recipe, options.context);

  if (recipe.minutes <= preferences.maxMinutes) score += 16;
  else score -= Math.min(30, recipe.minutes - preferences.maxMinutes);

  if (preferences.cookingEffort === 'minimo') {
    score += recipe.prepLevel === 'minimo' ? 16 : -10;
  }
  if (options.lowEnergy) {
    score += recipe.prepLevel === 'minimo' ? 18 : -12;
    if (recipe.minutes <= 10) score += 8;
  }

  score -= budgetPenalty(recipe, preferences);
  score -= recentRepeatPenalty(recipe, options.recentConsumptions);
  if (recipe.portable && (options.context === 'before' || options.context === 'working')) score += 8;

  return {
    recipe,
    owned,
    missing,
    optionalMissing,
    pantryCoverage,
    estimatedFit,
    score,
  };
}

export function rankFoodRecipes(
  recipes: FoodRecipe[],
  pantry: FoodPantryItem[],
  preferences: FoodPreferences,
  options: { context: FoodContext; lowEnergy: boolean; recentConsumptions?: FoodRecentConsumption[] },
) {
  return recipes
    .map((recipe) => matchFoodRecipe(recipe, pantry, preferences, options))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      if (a.recipe.minutes !== b.recipe.minutes) return a.recipe.minutes - b.recipe.minutes;
      return a.recipe.title.localeCompare(b.recipe.title, 'es');
    });
}

export function foodMatchLabel(match: FoodRecipeMatch) {
  const requiredCount = match.recipe.ingredients.filter((item) => !item.optional).length;
  if (requiredCount === 0) return 'Lista para hacer';
  return `Tienes ${match.owned.filter((item) => !item.optional).length}/${requiredCount}`;
}

export function foodMissingLabel(match: FoodRecipeMatch) {
  if (!match.missing.length) return 'No te falta nada esencial.';
  if (match.missing.length === 1) return `Falta: ${match.missing[0].name}`;
  return `Faltan: ${match.missing.map((item) => item.name).join(', ')}`;
}
