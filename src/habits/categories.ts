/** Categorías de Hábitos que alimentan los cinco ámbitos del Jardín.
 * No se infiere bienestar emocional, vínculos o tareas a partir de Move/Food.
 */
export const GARDEN_HABIT_CATEGORIES = [
  { key: 'relationships', title: 'Relaciones', icon: '🫶' },
  { key: 'wellbeing', title: 'Bienestar', icon: '🌿' },
  { key: 'home', title: 'Hogar', icon: '🏠' },
  { key: 'responsibilities', title: 'Responsabilidades', icon: '🧭' },
  { key: 'personal', title: 'Tiempo personal', icon: '☀️' },
] as const;
export type GardenHabitCategory = typeof GARDEN_HABIT_CATEGORIES[number]['key'];

export function isGardenHabitCategory(value: unknown): value is GardenHabitCategory {
  return GARDEN_HABIT_CATEGORIES.some(item => item.key === value);
}

/** Only well-defined legacy names are categorized, without writing to storage.
 * The user can override the suggestion when editing a habit.
 */
export function suggestGardenCategory(name: string): GardenHabitCategory | null {
  const text = name.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  if (/\b(relacion amorosa|pareja|salir con mi pareja|visitar familia|ver amigos|tiempo en familia)\b/.test(text)) return 'relationships';
  if (/\b(aseo|limpiar habitacion|limpiar casa|lavar ropa|ordenar habitacion|hacer cama|lavar loza)\b/.test(text)) return 'home';
  if (/\b(estudiar|tareas|pagar cuentas|hacer tramites|revisar presupuesto|trabajo pendiente)\b/.test(text)) return 'responsibilities';
  if (/\b(meditar|diario personal|respirar consciente|autocuidado|terapia)\b/.test(text)) return 'wellbeing';
  if (/\b(leer|lectura|dibujar|pintar|pasatiempo|hobby|tocar guitarra)\b/.test(text)) return 'personal';
  return null;
}

export function resolveGardenCategory(
  habit: { name: string; gardenCategory?: GardenHabitCategory | null },
): GardenHabitCategory | null {
  // Explicit null means intentionally left uncategorized; undefined is legacy.
  return habit.gardenCategory === undefined
    ? suggestGardenCategory(habit.name)
    : isGardenHabitCategory(habit.gardenCategory) ? habit.gardenCategory : null;
}
