import { MOVE_MUSCLE_GROUPS, MOVE_MUSCLE_LABELS, type MoveMuscleGroup } from '../move/muscles';

export type BrainChatTurn = { role: 'user' | 'assistant'; text: string };
export type BrainChatContext = {
  date: string;
  energy: string;
  jornada: string;
  move: string;
  rest: string;
  foodCount: number;
};
export type BrainChatSuggestion = {
  kind: 'none' | 'energy' | 'move' | 'energy_move';
  energy: 'none' | 'vigoroso' | 'bien' | 'cansado' | 'agotado';
  muscles: MoveMuscleGroup[];
};
export type BrainChatResult = {
  reply: string;
  suggestion: BrainChatSuggestion;
};

const KINDS = ['none', 'energy', 'move', 'energy_move'];
const ENERGIES = ['none', 'vigoroso', 'bien', 'cansado', 'agotado'];

export function normalizeBrainChatResult(value: unknown): BrainChatResult {
  if (!value || typeof value !== 'object') throw new Error('Respuesta de IA inválida.');
  const item = value as Record<string, unknown>;
  const suggestion = item.suggestion as Record<string, unknown> | null;
  if (typeof item.reply !== 'string' || !item.reply.trim() || item.reply.length > 1600 || !suggestion
    || !KINDS.includes(String(suggestion.kind)) || !ENERGIES.includes(String(suggestion.energy))
    || !Array.isArray(suggestion.muscles)
    || suggestion.muscles.length > MOVE_MUSCLE_GROUPS.length
    || suggestion.muscles.some((x) => !MOVE_MUSCLE_GROUPS.includes(x as MoveMuscleGroup))
    || new Set(suggestion.muscles).size !== suggestion.muscles.length) {
    throw new Error('La IA entregó una respuesta incompatible. No se aplicó nada.');
  }
  const kind = suggestion.kind as BrainChatSuggestion['kind'];
  const energy = suggestion.energy as BrainChatSuggestion['energy'];
  const muscles = suggestion.muscles as MoveMuscleGroup[];
  if ((kind === 'none' && (energy !== 'none' || muscles.length > 0))
    || ((kind === 'energy' || kind === 'energy_move') && energy === 'none')
    || ((kind === 'move') && energy !== 'none')
    || (kind === 'energy' && muscles.length > 0)) {
    throw new Error('La IA propuso una acción incoherente. No se aplicó nada.');
  }
  return { reply: item.reply.trim(), suggestion: { kind, energy, muscles } };
}

// La IA nunca guarda valores. Se convierte una intención tipada a un comando local
// del Asistente, que todavía valida y muestra el cambio para confirmarlo.
export function brainSuggestionToLocalCommand(s: BrainChatSuggestion): string | null {
  if (s.kind === 'none') return null;
  const move = 'quiero entrenar ' + (s.muscles.length
    ? s.muscles.map((g) => MOVE_MUSCLE_LABELS[g]).join(' y ')
    : 'cuerpo completo');
  const energy = s.energy === 'bien' ? 'estoy bien' : 'estoy ' + s.energy;
  return s.kind === 'move' ? move : s.kind === 'energy' ? energy : energy + ' y ' + move;
}

export function brainSuggestionLabel(s: BrainChatSuggestion): string {
  if (s.kind === 'none') return '';
  const muscles = s.muscles.length
    ? s.muscles.map(g => MOVE_MUSCLE_LABELS[g]).join(', ')
    : 'Cuerpo completo';
  if (s.kind === 'energy') return 'Energía actual: ' + s.energy;
  if (s.kind === 'move') return 'Entrenamiento: ' + muscles;
  return 'Energía: ' + s.energy + ' · entrenamiento: ' + muscles;
}

export function sanitizeBrainChatHistory(history: readonly BrainChatTurn[]): BrainChatTurn[] {
  return history.slice(-6).filter(x => (x.role === 'user' || x.role === 'assistant') && typeof x.text === 'string')
    .map(x => ({ role: x.role, text: x.text.slice(0, 600) }));
}
