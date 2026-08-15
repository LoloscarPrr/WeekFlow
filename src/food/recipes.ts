export type FoodRecipeIngredient = {
  name: string;
  amount: string;
};

export type FoodRecipe = {
  id: string;
  icon: string;
  title: string;
  minutes: number;
  portions: number;
  difficulty: 'Muy fácil' | 'Fácil';
  ingredients: FoodRecipeIngredient[];
  substitutions: string[];
  steps: string[];
};

const RECIPES: Record<string, FoodRecipe> = {
  'yogurt-bowl': {
    id: 'yogurt-bowl',
    icon: '🥣',
    title: 'Yogur + fruta + frutos secos',
    minutes: 5,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { name: 'Yogur natural o de tu preferencia', amount: '1 porción' },
      { name: 'Fruta', amount: '1 unidad o 1 taza' },
      { name: 'Frutos secos', amount: '1 puñado pequeño' },
    ],
    substitutions: [
      'Sin frutos secos: usa avena, cereal simple o semillas que ya tengas.',
      'Sin yogur: puedes usar leche o una alternativa vegetal y sumar avena.',
    ],
    steps: [
      'Pon el yogur en un bowl o recipiente que puedas llevar.',
      'Lava y corta la fruta si hace falta, y agrégala encima.',
      'Añade los frutos secos al final para que mantengan textura.',
      'Mezcla si quieres y listo. Si es para llevar, ciérralo y guárdalo frío.',
    ],
  },
  'egg-tomato-toast': {
    id: 'egg-tomato-toast',
    icon: '🍳',
    title: 'Pan con huevo y tomate',
    minutes: 10,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { name: 'Pan', amount: '2 rebanadas o 1 unidad' },
      { name: 'Huevo', amount: '1–2 unidades' },
      { name: 'Tomate', amount: '1/2–1 unidad' },
      { name: 'Aceite y sal', amount: 'Una pequeña cantidad' },
    ],
    substitutions: [
      'Sin tomate: usa otra verdura que ya tengas y te guste.',
      'Sin pan: acompaña el huevo con papa, arroz u otra base disponible.',
    ],
    steps: [
      'Lava el tomate y córtalo en rodajas o cubos.',
      'Calienta una sartén a fuego medio con una pequeña cantidad de aceite.',
      'Cocina el huevo hasta que esté completamente cuajado a tu gusto.',
      'Arma el pan con el huevo y el tomate. Ajusta sal si quieres y sirve.',
    ],
  },
  'simple-rice-bowl': {
    id: 'simple-rice-bowl',
    icon: '🍛',
    title: 'Arroz + huevo + verduras',
    minutes: 15,
    portions: 1,
    difficulty: 'Fácil',
    ingredients: [
      { name: 'Arroz cocido', amount: '1 taza aprox.' },
      { name: 'Huevo', amount: '1–2 unidades' },
      { name: 'Verduras disponibles', amount: '1 taza aprox.' },
      { name: 'Aceite y condimentos', amount: 'A gusto' },
    ],
    substitutions: [
      'Sin arroz: usa papa, pasta, cuscús u otra base que ya tengas.',
      'Puedes cambiar el huevo por legumbres ya cocidas u otra proteína disponible.',
      'Las verduras pueden ser frescas, congeladas o las que hayan quedado de otra comida.',
    ],
    steps: [
      'Deja todos los ingredientes a mano y corta las verduras si lo necesitan.',
      'Calienta las verduras en una sartén a fuego medio con una pequeña cantidad de aceite.',
      'Agrega el arroz cocido y mezcla hasta que todo esté bien caliente.',
      'Cocina el huevo por separado hasta que esté completamente cuajado.',
      'Sirve el arroz con verduras y el huevo encima. Condimenta a tu gusto.',
    ],
  },
  'simple-sandwich': {
    id: 'simple-sandwich',
    icon: '🥪',
    title: 'Sándwich simple + algo fresco',
    minutes: 8,
    portions: 1,
    difficulty: 'Muy fácil',
    ingredients: [
      { name: 'Pan', amount: '2 rebanadas o 1 unidad' },
      { name: 'Huevo cocido, pollo cocido o queso', amount: '1 porción' },
      { name: 'Verdura fresca', amount: 'A gusto' },
    ],
    substitutions: [
      'Usa la proteína que ya tengas lista en casa.',
      'Si no tienes verdura, acompáñalo con una fruta u otra opción fresca disponible.',
    ],
    steps: [
      'Elige una base: huevo ya cocido, pollo ya cocido o queso.',
      'Lava y corta la verdura que vayas a usar.',
      'Arma el sándwich con la base y la verdura.',
      'Si lo llevarás al trabajo, envuélvelo o guárdalo en un recipiente limpio.',
    ],
  },
};

const SUGGESTION_RECIPE: Record<string, keyof typeof RECIPES> = {
  'work-yogurt': 'yogurt-bowl',
  'after-yogurt': 'yogurt-bowl',
  'free-breakfast-yogurt': 'yogurt-bowl',
  'free-lunch-yogurt': 'yogurt-bowl',
  'free-evening-yogurt': 'yogurt-bowl',
  'before-egg': 'egg-tomato-toast',
  'after-egg': 'egg-tomato-toast',
  'free-breakfast-egg': 'egg-tomato-toast',
  'free-evening-egg': 'egg-tomato-toast',
  'after-plate': 'simple-rice-bowl',
  'free-lunch-plate': 'simple-rice-bowl',
  'work-sandwich': 'simple-sandwich',
  'before-sandwich': 'simple-sandwich',
  'free-lunch-sandwich': 'simple-sandwich',
};

export function recipeForSuggestion(suggestionId: string): FoodRecipe | null {
  const recipeId = SUGGESTION_RECIPE[suggestionId];
  return recipeId ? RECIPES[recipeId] : null;
}
