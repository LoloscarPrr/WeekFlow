import {
  foodLabelForKey,
  mergeFoodPantry,
  parseFoodPantryInput,
  type FoodPantryItem,
} from './pantry';

export type FoodPhotoCandidate = FoodPantryItem & {
  evidence: string;
};

const PHOTO_TERMS: Array<{ key: string; terms: string[] }> = [
  { key: 'huevo', terms: ['huevo', 'huevos'] },
  { key: 'tomate', terms: ['tomate', 'tomates'] },
  { key: 'papa', terms: ['papa', 'papas', 'patata', 'patatas'] },
  { key: 'arroz', terms: ['arroz'] },
  { key: 'pasta', terms: ['pasta', 'fideos', 'tallarines', 'spaghetti', 'espagueti'] },
  { key: 'pan', terms: ['pan', 'hallulla', 'marraqueta'] },
  { key: 'yogur', terms: ['yogur', 'yogurt', 'yoghurt'] },
  { key: 'leche', terms: ['leche'] },
  { key: 'avena', terms: ['avena'] },
  { key: 'fruta', terms: ['fruta', 'frutas'] },
  { key: 'platano', terms: ['platano', 'plátano', 'banana', 'bananas'] },
  { key: 'manzana', terms: ['manzana', 'manzanas'] },
  { key: 'verdura', terms: ['verdura', 'verduras', 'vegetal', 'vegetales'] },
  { key: 'pollo', terms: ['pollo', 'pechuga'] },
  { key: 'queso', terms: ['queso', 'quesos'] },
  { key: 'lenteja', terms: ['lenteja', 'lentejas'] },
  { key: 'garbanzo', terms: ['garbanzo', 'garbanzos'] },
  { key: 'poroto', terms: ['poroto', 'porotos', 'frijol', 'frijoles'] },
  { key: 'atun', terms: ['atun', 'atún'] },
  { key: 'tortilla', terms: ['tortilla', 'tortillas'] },
  { key: 'cebolla', terms: ['cebolla', 'cebollas'] },
  { key: 'zanahoria', terms: ['zanahoria', 'zanahorias'] },
  { key: 'frutos-secos', terms: ['frutos secos', 'nueces', 'almendras'] },
  { key: 'semillas', terms: ['semilla', 'semillas'] },
  { key: 'aceite', terms: ['aceite'] },
  { key: 'condimentos', terms: ['condimento', 'condimentos', 'especias'] },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function termRegex(term: string) {
  const normalized = normalize(term).replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
  return new RegExp('(^|\\s)' + normalized + '(?=\\s|$)', 'i');
}

export function foodPhotoCandidatesFromText(text: string): FoodPhotoCandidate[] {
  const normalizedText = normalize(text);
  if (!normalizedText) return [];

  const result: FoodPhotoCandidate[] = [];
  const seen = new Set<string>();

  for (const entry of PHOTO_TERMS) {
    const matched = entry.terms.find((term) => termRegex(term).test(normalizedText));
    if (!matched || seen.has(entry.key)) continue;
    seen.add(entry.key);
    result.push({
      key: entry.key,
      label: foodLabelForKey(entry.key),
      evidence: matched,
    });
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function collectRecognizedText(value: unknown, target: string[]) {
  if (!value || typeof value !== 'object') return;
  const node = value as Record<string, unknown>;
  if (typeof node.text === 'string' && node.text.trim()) target.push(node.text);

  for (const key of ['blocks', 'lines', 'elements']) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) collectRecognizedText(item, target);
    }
  }
}

export function foodPhotoCandidatesFromOcr(value: unknown): FoodPhotoCandidate[] {
  const texts: string[] = [];
  collectRecognizedText(value, texts);
  return foodPhotoCandidatesFromText(texts.join('\n'));
}

export function confirmedPhotoPantryItems(
  candidates: FoodPhotoCandidate[],
  selectedKeys: Iterable<string>,
  manualText: string,
): FoodPantryItem[] {
  const selected = new Set(selectedKeys);
  const confirmed = candidates
    .filter((candidate) => selected.has(candidate.key))
    .map(({ key, label }) => ({ key, label }));

  return mergeFoodPantry(confirmed, parseFoodPantryInput(manualText));
}
