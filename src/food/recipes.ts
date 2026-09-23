export type FoodRecipeIngredient = {
  key: string;
  name: string;
  amount: string;
  optional?: boolean;
};

export type FoodRecipeContext = 'any' | 'before' | 'working' | 'after' | 'free';

export type FoodRecipe = {
  id: string;
  icon: string;
  title: string;
  minutes: number;
  portions: number;
  difficulty: 'Muy fácil' | 'Fácil' | 'Media';
  ingredients: FoodRecipeIngredient[];
  substitutions: string[];
  steps: string[];
  contexts: FoodRecipeContext[];
  costTier: 1 | 2 | 3;
  prepLevel: 'minimo' | 'normal';
  portable?: boolean;
};

export const RECIPES: FoodRecipe[] = [
  {
    id: 'yogurt-bowl',
    icon: '🥣',
    title: 'Yogur + fruta + frutos secos',
    minutes: 5,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { key: 'yogur', name: 'Yogur', amount: '1 porción' },
      { key: 'fruta', name: 'Fruta', amount: '1 unidad o 1 taza' },
      { key: 'frutos-secos', name: 'Frutos secos', amount: '1 puñado pequeño', optional: true },
    ],
    substitutions: [
      'Sin frutos secos: usa avena, cereal simple o semillas que ya tengas.',
      'Sin yogur: puedes usar leche o una alternativa vegetal y sumar avena.',
    ],
    steps: [
      'Pon el yogur en un bowl o recipiente que puedas llevar.',
      'Lava y corta la fruta si hace falta, y agrégala encima.',
      'Añade frutos secos o semillas si tienes.',
      'Mezcla si quieres. Si es para llevar, ciérralo y mantenlo frío.',
    ],
    contexts: ['any'],
    costTier: 1,
    prepLevel: 'minimo',
    portable: true,
  },
  {
    id: 'egg-tomato-toast',
    icon: '🍳',
    title: 'Pan con huevo y tomate',
    minutes: 10,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'pan', name: 'Pan', amount: '2 rebanadas o 1 unidad' },
      { key: 'huevo', name: 'Huevo', amount: '1–2 unidades' },
      { key: 'tomate', name: 'Tomate', amount: '1/2–1 unidad' },
      { key: 'aceite', name: 'Aceite', amount: 'Una pequeña cantidad', optional: true },
    ],
    substitutions: [
      'Sin tomate: usa otra verdura que ya tengas.',
      'Sin pan: acompaña el huevo con papa, arroz u otra base disponible.',
    ],
    steps: [
      'Lava el tomate y córtalo en rodajas o cubos.',
      'Calienta una sartén a fuego medio con una pequeña cantidad de aceite si lo necesitas.',
      'Cocina el huevo hasta que esté completamente cuajado a tu gusto.',
      'Arma el pan con el huevo y el tomate y sirve.',
    ],
    contexts: ['before', 'after', 'free'],
    costTier: 1,
    prepLevel: 'minimo',
  },
  {
    id: 'simple-rice-bowl',
    icon: '🍛',
    title: 'Arroz + huevo + verduras',
    minutes: 15,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'arroz', name: 'Arroz cocido', amount: '1 taza aprox.' },
      { key: 'huevo', name: 'Huevo', amount: '1–2 unidades' },
      { key: 'verdura', name: 'Verduras', amount: '1 taza aprox.' },
      { key: 'condimentos', name: 'Condimentos', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Sin arroz: usa papa, pasta u otra base que ya tengas.',
      'Puedes cambiar el huevo por legumbres ya cocidas u otra proteína disponible.',
      'Las verduras pueden ser frescas, congeladas o sobras de otra comida.',
    ],
    steps: [
      'Deja todos los ingredientes a mano y corta las verduras si lo necesitan.',
      'Calienta las verduras en una sartén a fuego medio.',
      'Agrega el arroz cocido y mezcla hasta que todo esté bien caliente.',
      'Cocina el huevo por separado hasta que esté completamente cuajado.',
      'Sirve el arroz con verduras y el huevo encima.',
    ],
    contexts: ['after', 'free'],
    costTier: 1,
    prepLevel: 'normal',
  },
  {
    id: 'simple-sandwich',
    icon: '🥪',
    title: 'Sándwich simple + algo fresco',
    minutes: 8,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { key: 'pan', name: 'Pan', amount: '2 rebanadas o 1 unidad' },
      { key: 'queso', name: 'Queso', amount: '1 porción' },
      { key: 'verdura', name: 'Verdura fresca', amount: 'A gusto', optional: true },
      { key: 'fruta', name: 'Fruta', amount: '1 unidad', optional: true },
    ],
    substitutions: [
      'Puedes cambiar el queso por huevo cocido, pollo cocido o atún si ya lo tienes.',
      'Si no tienes verdura, acompáñalo con una fruta.',
    ],
    steps: [
      'Elige la base que tengas disponible.',
      'Lava y corta la verdura si la vas a usar.',
      'Arma el sándwich.',
      'Si lo llevarás al trabajo, guárdalo en un recipiente adecuado.',
    ],
    contexts: ['before', 'working', 'free'],
    costTier: 1,
    prepLevel: 'minimo',
    portable: true,
  },
  {
    id: 'oat-banana-bowl',
    icon: '🥛',
    title: 'Avena + leche + plátano',
    minutes: 7,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { key: 'avena', name: 'Avena', amount: '1/2–1 taza' },
      { key: 'leche', name: 'Leche', amount: '1 taza aprox.' },
      { key: 'platano', name: 'Plátano', amount: '1 unidad' },
      { key: 'semillas', name: 'Semillas', amount: '1 cucharada', optional: true },
    ],
    substitutions: [
      'Puedes usar yogur en lugar de leche.',
      'Otra fruta puede reemplazar el plátano.',
    ],
    steps: [
      'Pon la avena en un bowl.',
      'Agrega leche o yogur.',
      'Corta el plátano y agrégalo.',
      'Suma semillas si tienes y mezcla.',
    ],
    contexts: ['before', 'working', 'free'],
    costTier: 1,
    prepLevel: 'minimo',
    portable: true,
  },
  {
    id: 'lentil-rice-bowl',
    icon: '🫘',
    title: 'Lentejas + arroz + verduras',
    minutes: 15,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'lenteja', name: 'Lentejas cocidas', amount: '1 taza aprox.' },
      { key: 'arroz', name: 'Arroz cocido', amount: '1 taza aprox.' },
      { key: 'verdura', name: 'Verduras', amount: '1 taza aprox.' },
      { key: 'condimentos', name: 'Condimentos', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Puedes usar porotos o garbanzos en lugar de lentejas.',
      'Sin arroz: usa papa, pasta u otra base que ya tengas.',
    ],
    steps: [
      'Calienta las lentejas cocidas.',
      'Calienta el arroz y las verduras.',
      'Combina todo en un bowl o plato.',
      'Condimenta a tu gusto.',
    ],
    contexts: ['after', 'free'],
    costTier: 1,
    prepLevel: 'normal',
  },
  {
    id: 'tuna-rice-bowl',
    icon: '🐟',
    title: 'Arroz + atún + tomate',
    minutes: 8,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { key: 'arroz', name: 'Arroz cocido', amount: '1 taza aprox.' },
      { key: 'atun', name: 'Atún', amount: '1 porción' },
      { key: 'tomate', name: 'Tomate', amount: '1 unidad' },
      { key: 'aceite', name: 'Aceite', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Puedes cambiar el atún por huevo cocido, pollo cocido o legumbres.',
      'Sin tomate: usa otra verdura fresca o cocida.',
    ],
    steps: [
      'Pon el arroz en un bowl y caliéntalo si quieres.',
      'Agrega el atún escurrido.',
      'Lava y corta el tomate.',
      'Mezcla y termina con una pequeña cantidad de aceite si quieres.',
    ],
    contexts: ['working', 'after', 'free'],
    costTier: 2,
    prepLevel: 'minimo',
    portable: true,
  },
  {
    id: 'chicken-potato-pan',
    icon: '🍗',
    title: 'Pollo + papa + verduras',
    minutes: 25,
    portions: 2,
    difficulty: 'Media',
    ingredients: [
      { key: 'pollo', name: 'Pollo', amount: '2 porciones' },
      { key: 'papa', name: 'Papa', amount: '2–3 unidades medianas' },
      { key: 'verdura', name: 'Verduras', amount: '1–2 tazas' },
      { key: 'condimentos', name: 'Condimentos', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Puedes reemplazar la papa por arroz o pasta.',
      'Puedes usar verduras congeladas para reducir preparación.',
    ],
    steps: [
      'Corta la papa en trozos pequeños para que se cocine más rápido.',
      'Cocina el pollo completamente en una sartén amplia.',
      'Agrega papa y verduras, con un poco de agua si hace falta.',
      'Cocina hasta que la papa esté blanda y el pollo completamente cocido.',
      'Condimenta y divide en dos porciones si quieres dejar una lista.',
    ],
    contexts: ['after', 'free'],
    costTier: 2,
    prepLevel: 'normal',
  },
  {
    id: 'quick-pasta-egg',
    icon: '🍝',
    title: 'Pasta rápida + huevo + tomate',
    minutes: 18,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'pasta', name: 'Pasta', amount: '1 porción' },
      { key: 'huevo', name: 'Huevo', amount: '1–2 unidades' },
      { key: 'tomate', name: 'Tomate', amount: '1 unidad' },
      { key: 'condimentos', name: 'Condimentos', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Puedes usar arroz en lugar de pasta.',
      'Sin tomate: usa verduras cocidas o congeladas.',
    ],
    steps: [
      'Cocina la pasta según el envase.',
      'Mientras, cocina el huevo hasta que esté completamente cuajado.',
      'Corta el tomate.',
      'Mezcla la pasta con tomate y sirve con el huevo.',
    ],
    contexts: ['after', 'free'],
    costTier: 1,
    prepLevel: 'normal',
  },
  {
    id: 'bean-tortilla-wrap',
    icon: '🌯',
    title: 'Wrap de porotos y queso',
    minutes: 10,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'tortilla', name: 'Tortilla', amount: '1–2 unidades' },
      { key: 'poroto', name: 'Porotos cocidos', amount: '1/2–1 taza' },
      { key: 'queso', name: 'Queso', amount: '1 porción' },
      { key: 'tomate', name: 'Tomate', amount: '1/2 unidad', optional: true },
    ],
    substitutions: [
      'Puedes usar garbanzos o lentejas en lugar de porotos.',
      'Sin tortilla: usa pan y conviértelo en sándwich.',
    ],
    steps: [
      'Calienta los porotos.',
      'Ponlos sobre la tortilla.',
      'Agrega queso y tomate si tienes.',
      'Cierra el wrap y caliéntalo brevemente si quieres.',
    ],
    contexts: ['before', 'working', 'free'],
    costTier: 1,
    prepLevel: 'minimo',
    portable: true,
  },
  {
    id: 'potato-egg-skillet',
    icon: '🥔',
    title: 'Papa salteada + huevo',
    minutes: 20,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { key: 'papa', name: 'Papa', amount: '1–2 unidades medianas' },
      { key: 'huevo', name: 'Huevo', amount: '1–2 unidades' },
      { key: 'cebolla', name: 'Cebolla', amount: '1/4 unidad', optional: true },
      { key: 'condimentos', name: 'Condimentos', amount: 'A gusto', optional: true },
    ],
    substitutions: [
      'Puedes usar arroz cocido en lugar de papa para reducir el tiempo.',
      'La cebolla es opcional.',
    ],
    steps: [
      'Corta la papa en cubos pequeños.',
      'Cocínala en sartén hasta que esté blanda y dorada.',
      'Agrega cebolla si tienes.',
      'Cocina el huevo completamente y sírvelo encima.',
    ],
    contexts: ['after', 'free'],
    costTier: 1,
    prepLevel: 'normal',
  },
  {
    id: 'chickpea-salad',
    icon: '🥗',
    title: 'Garbanzos + tomate + verduras',
    minutes: 8,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { key: 'garbanzo', name: 'Garbanzos cocidos', amount: '1 taza aprox.' },
      { key: 'tomate', name: 'Tomate', amount: '1 unidad' },
      { key: 'verdura', name: 'Verduras frescas', amount: '1 taza aprox.', optional: true },
      { key: 'aceite', name: 'Aceite', amount: 'Una pequeña cantidad', optional: true },
    ],
    substitutions: [
      'Puedes usar lentejas o porotos en lugar de garbanzos.',
      'Usa las verduras que tengas disponibles.',
    ],
    steps: [
      'Enjuaga y escurre los garbanzos si vienen en conserva.',
      'Lava y corta el tomate y las verduras.',
      'Mezcla todo.',
      'Agrega una pequeña cantidad de aceite y condimentos si quieres.',
    ],
    contexts: ['working', 'after', 'free'],
    costTier: 1,
    prepLevel: 'minimo',
    portable: true,
  },
];

export const FOOD_RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe]),
) as Record<string, FoodRecipe>;

const SUGGESTION_RECIPE: Record<string, string> = {
  'work-yogurt': 'yogurt-bowl',
  'after-yogurt': 'yogurt-bowl',
  'free-breakfast-yogurt': 'yogurt-bowl',
  'free-lunch-yogurt': 'yogurt-bowl',
  'free-evening-yogurt': 'yogurt-bowl',
  'before-egg': 'egg-tomato-toast',
  'after-egg': 'egg-tomato-toast',
  'free-breakfast-egg': 'egg-tomato-toast',
  'free-evening-egg': 'egg-tomato-toast',
  'before-oats': 'oat-banana-bowl',
  'free-breakfast-oats': 'oat-banana-bowl',
  'after-plate': 'simple-rice-bowl',
  'free-lunch-plate': 'simple-rice-bowl',
  'work-sandwich': 'simple-sandwich',
  'before-sandwich': 'simple-sandwich',
  'free-lunch-sandwich': 'simple-sandwich',
};

export function recipeForSuggestion(suggestionId: string): FoodRecipe | null {
  const recipeId = SUGGESTION_RECIPE[suggestionId];
  return recipeId ? FOOD_RECIPE_BY_ID[recipeId] ?? null : null;
}

export function recipeById(recipeId: string) {
  return FOOD_RECIPE_BY_ID[recipeId] ?? null;
}
