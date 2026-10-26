import { MOVE_MUSCLE_GROUPS, type MoveMuscleGroup } from '../move/muscles';

function normalize(input: string) {
  return input.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

// Conservador: solo órdenes afirmativas de entrenar; no interpretar dolor, negaciones ni consultas.
export function parseMoveTargetRequest(input: string): MoveMuscleGroup[] | null {
  const text = normalize(input);
  if (!/\b(entrenar|entrenamiento|rutina|ejercicios|ejercitar|trabajar|hazme|armame|preparame|organiza|quiero)\b/.test(text)) return null;
  if (/\b(no quiero|no puedo|no voy|no alcanzo|evitar|evita|dolor|duele|lesion|lesionado|lesionada)\b/.test(text)) return null;
  if (/\b(cuerpo completo|todo el cuerpo|full body|fullbody)\b/.test(text)) return [];
  const chosen = new Set<MoveMuscleGroup>();
  if (/\b(brazos?|antebrazos?)\b/.test(text)) {
    chosen.add('biceps');
    chosen.add('triceps');
  }
  if (/\b(tren superior|parte superior|upper body)\b/.test(text)) {
    (['pecho', 'espalda', 'hombros', 'biceps', 'triceps'] as const).forEach((g) => chosen.add(g));
  }
  if (/\b(tren inferior|parte inferior|lower body)\b/.test(text)) {
    (['piernas', 'gluteos'] as const).forEach((g) => chosen.add(g));
  }
  const aliases: Record<MoveMuscleGroup, RegExp> = {
    pecho: /\b(pecho|pectorales?)\b/,
    espalda: /\b(espalda|dorsales?)\b/,
    hombros: /\b(hombros?|deltoides)\b/,
    biceps: /\b(biceps)\b/,
    triceps: /\b(triceps)\b/,
    piernas: /\b(piernas?|cuadriceps|femorales|pantorrillas|gemelos)\b/,
    gluteos: /\b(gluteos?|nalgas)\b/,
    core: /\b(abdominales?|abdomen|core|oblicuos)\b/,
  };
  MOVE_MUSCLE_GROUPS.forEach((group) => { if (aliases[group].test(text)) chosen.add(group); });
  return chosen.size ? MOVE_MUSCLE_GROUPS.filter((group) => chosen.has(group)) : null;
}
