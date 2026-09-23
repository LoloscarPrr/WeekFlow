export type FoodBudgetPreference = 'ajustar' | 'normal' | 'flexible';
export type FoodCookingEffort = 'minimo' | 'normal';
export type FoodMaxMinutes = 10 | 20 | 30;

export type FoodPreferences = {
  maxMinutes: FoodMaxMinutes;
  budget: FoodBudgetPreference;
  cookingEffort: FoodCookingEffort;
};

export type FoodPantryItem = {
  key: string;
  label: string;
};

export type FoodShoppingItem = {
  key: string;
  label: string;
  checked: boolean;
  addedAt: string;
};

export const DEFAULT_FOOD_PREFERENCES: FoodPreferences = {
  maxMinutes: 20,
  budget: 'normal',
  cookingEffort: 'normal',
};

const ALIASES: Record<string, string> = {
  huevos: 'huevo',
  huevo: 'huevo',
  tomates: 'tomate',
  tomate: 'tomate',
  papas: 'papa',
  patatas: 'papa',
  papa: 'papa',
  arroces: 'arroz',
  arroz: 'arroz',
  fideos: 'pasta',
  tallarines: 'pasta',
  pasta: 'pasta',
  panes: 'pan',
  pan: 'pan',
  yogures: 'yogur',
  yogurt: 'yogur',
  yogur: 'yogur',
  leches: 'leche',
  leche: 'leche',
  avenas: 'avena',
  avena: 'avena',
  frutas: 'fruta',
  fruta: 'fruta',
  bananas: 'platano',
  banana: 'platano',
  platanos: 'platano',
  platano: 'platano',
  manzanas: 'manzana',
  manzana: 'manzana',
  verduras: 'verdura',
  vegetales: 'verdura',
  verdura: 'verdura',
  pollos: 'pollo',
  pollo: 'pollo',
  quesos: 'queso',
  queso: 'queso',
  lentejas: 'lenteja',
  lenteja: 'lenteja',
  garbanzos: 'garbanzo',
  garbanzo: 'garbanzo',
  porotos: 'poroto',
  frijoles: 'poroto',
  poroto: 'poroto',
  atun: 'atun',
  atunes: 'atun',
  tortillas: 'tortilla',
  tortilla: 'tortilla',
  cebollas: 'cebolla',
  cebolla: 'cebolla',
  zanahorias: 'zanahoria',
  zanahoria: 'zanahoria',
  frutossecos: 'frutos-secos',
  nueces: 'frutos-secos',
  almendras: 'frutos-secos',
  semillas: 'semillas',
  aceite: 'aceite',
  condimentos: 'condimentos',
};

const LABELS: Record<string, string> = {
  huevo: 'Huevo',
  tomate: 'Tomate',
  papa: 'Papa',
  arroz: 'Arroz',
  pasta: 'Pasta',
  pan: 'Pan',
  yogur: 'Yogur',
  leche: 'Leche',
  avena: 'Avena',
  fruta: 'Fruta',
  platano: 'Plátano',
  manzana: 'Manzana',
  verdura: 'Verduras',
  pollo: 'Pollo',
  queso: 'Queso',
  lenteja: 'Lentejas',
  garbanzo: 'Garbanzos',
  poroto: 'Porotos',
  atun: 'Atún',
  tortilla: 'Tortilla',
  cebolla: 'Cebolla',
  zanahoria: 'Zanahoria',
  'frutos-secos': 'Frutos secos',
  semillas: 'Semillas',
  aceite: 'Aceite',
  condimentos: 'Condimentos',
};

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function canonicalFoodKey(value: string) {
  const normalized = stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 -]/g, '');
  if (!normalized) return '';
  const compact = normalized.replace(/[ -]/g, '');
  if (ALIASES[normalized]) return ALIASES[normalized];
  if (ALIASES[compact]) return ALIASES[compact];

  const singular = normalized.endsWith('es') && normalized.length > 4
    ? normalized.slice(0, -2)
    : normalized.endsWith('s') && normalized.length > 3
      ? normalized.slice(0, -1)
      : normalized;
  return ALIASES[singular] ?? singular.replace(/\s+/g, '-');
}

export function foodLabelForKey(key: string) {
  if (LABELS[key]) return LABELS[key];
  return key
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function parseFoodPantryInput(value: string): FoodPantryItem[] {
  const seen = new Set<string>();
  const items: FoodPantryItem[] = [];
  for (const token of value.split(/[,;\n]+/)) {
    const key = canonicalFoodKey(token);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ key, label: foodLabelForKey(key) });
  }
  return items;
}

export function sanitizeFoodPantry(value: unknown): FoodPantryItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: FoodPantryItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const raw = candidate as Partial<FoodPantryItem>;
    const key = canonicalFoodKey(typeof raw.key === 'string' ? raw.key : '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({
      key,
      label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : foodLabelForKey(key),
    });
  }
  return result;
}

export function mergeFoodPantry(current: FoodPantryItem[], incoming: FoodPantryItem[]) {
  const map = new Map(current.map((item) => [item.key, item]));
  for (const item of incoming) map.set(item.key, item);
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function sanitizeFoodPreferences(value: unknown): FoodPreferences {
  const candidate = value && typeof value === 'object' ? value as Partial<FoodPreferences> : {};
  return {
    maxMinutes: candidate.maxMinutes === 10 || candidate.maxMinutes === 30 ? candidate.maxMinutes : 20,
    budget: candidate.budget === 'ajustar' || candidate.budget === 'flexible' ? candidate.budget : 'normal',
    cookingEffort: candidate.cookingEffort === 'minimo' ? 'minimo' : 'normal',
  };
}

export function sanitizeFoodShopping(value: unknown): FoodShoppingItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: FoodShoppingItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const raw = candidate as Partial<FoodShoppingItem>;
    const key = canonicalFoodKey(typeof raw.key === 'string' ? raw.key : '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({
      key,
      label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : foodLabelForKey(key),
      checked: Boolean(raw.checked),
      addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : new Date(0).toISOString(),
    });
  }
  return result;
}

export function addShoppingItems(
  current: FoodShoppingItem[],
  ingredients: Array<{ key: string; name: string }>,
  now = new Date(),
) {
  const map = new Map(current.map((item) => [item.key, item]));
  for (const ingredient of ingredients) {
    const key = canonicalFoodKey(ingredient.key);
    if (!key || map.has(key)) continue;
    map.set(key, {
      key,
      label: ingredient.name || foodLabelForKey(key),
      checked: false,
      addedAt: now.toISOString(),
    });
  }
  return [...map.values()].sort((a, b) => Number(a.checked) - Number(b.checked) || a.label.localeCompare(b.label, 'es'));
}
