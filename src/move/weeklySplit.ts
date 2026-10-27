import type { MovePreferences } from './adaptation';
import { sanitizeTargetMuscles, type MoveMuscleGroup } from './muscles';

type Group = readonly MoveMuscleGroup[];
const PUSH: Group = ['pecho', 'hombros', 'triceps'];
const PULL: Group = ['espalda', 'biceps'];
const LOWER: Group = ['piernas', 'gluteos', 'core'];
const UPPER: Group = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps'];

function intersect(selected: readonly MoveMuscleGroup[], section: Group): MoveMuscleGroup[] {
  return section.filter(group => selected.includes(group));
}

/**
 * Pure and deterministic weekly training split. An empty list means full-body,
 * not "no workout". Only the specified muscles may be trained when targeted.
 * Group allocation is a planning suggestion, not clinical periodization.
 */
export function moveWeeklySplit(preferences: MovePreferences, requested: number): MoveMuscleGroup[][] {
  const count = Math.max(0, Math.min(5, Math.trunc(requested)));
  if (!count) return [];
  const selected = sanitizeTargetMuscles(preferences.targetMuscles);
  if (!selected.length && (preferences.goal === 'condicion' || preferences.goal === 'movilidad')) {
    return Array.from({ length: count }, () => []);
  }
  if (count === 1) return [selected];

  let sections: MoveMuscleGroup[][];
  if (!selected.length) {
    sections = count === 2
      ? [Array.from(UPPER), Array.from(LOWER)]
      : [Array.from(PUSH), Array.from(LOWER), Array.from(PULL)];
  } else {
    sections = [intersect(selected, PUSH), intersect(selected, LOWER), intersect(selected, PULL)]
      .filter(s => s.length > 0);
    // Prefer balanced alternation when the user explicitly selected only two
    // categories (e.g. back/biceps and legs), rather than adding unrequested muscles.
    if (sections.length === 1) sections = [selected];
  }
  return Array.from({ length: count }, (_, i) => [...sections[i % sections.length]]);
}
