import type { FoodContext } from './suggestions';
import type { FoodPantryItem, FoodPreferences } from './pantry';
import type { FoodRecipe, FoodRecipeIngredient } from './recipes';

export type FoodRecipeFit = 'listo' | 'casi' | 'compras';

export type FoodRecipeMatch = {
  recipe: FoodRecipe;
  owned: FoodRecipeIngredient[];
  missing: FoodRecipeIngredient[];
  optionalMissing: FoodRecipeIngredient[];
  pantryCoverage: number;
  estimatedFit: FoodRecipeFit;
  score: number;
};

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
  options: { context: FoodContext; lowEnergy: boolean },
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
  options: { context: FoodContext; lowEnergy: boolean },
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
