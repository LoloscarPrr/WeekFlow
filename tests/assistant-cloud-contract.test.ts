import { normalizeBrainChatResult, brainSuggestionToLocalCommand, sanitizeBrainChatHistory } from '../src/assistant/cloudContract';
import { interpretAssistantText } from '../src/assistant/interpret';

function ok(x: unknown, m: string) { if (!x) throw new Error(m); }
function same(x: unknown, y: unknown, m: string) {
  if (JSON.stringify(x) !== JSON.stringify(y)) throw new Error(m + ': ' + JSON.stringify(x));
}
const natural = normalizeBrainChatResult({
  reply: 'Puedo prepararte espalda y bíceps con intensidad suave.',
  suggestion: { kind: 'energy_move', energy: 'cansado', muscles: ['espalda', 'biceps'] },
});
same(natural.suggestion.kind, 'energy_move', 'acción reconocida');
const command = brainSuggestionToLocalCommand(natural.suggestion);
ok(command, 'comando se puede revisar localmente');
same(interpretAssistantText(command!).status, 'energy-move-intent', 'la propuesta cloud respeta parser canónico');
const full = normalizeBrainChatResult({ reply: 'Puedes entrenar todo el cuerpo.', suggestion: { kind: 'move', energy: 'none', muscles: [] } });
same(interpretAssistantText(brainSuggestionToLocalCommand(full.suggestion)!).status, 'move-target-intent', 'cuerpo completo');
const energy = normalizeBrainChatResult({ reply: 'Entiendo que estás agotado.', suggestion: { kind: 'energy', energy: 'agotado', muscles: [] } });
same(interpretAssistantText(brainSuggestionToLocalCommand(energy.suggestion)!).status, 'proposal', 'energía pasa por propuesta canónica');
same(brainSuggestionToLocalCommand({ kind: 'none', energy: 'none', muscles: [] }), null, 'respuesta conversacional no crea acción');

for (const invalid of [
  null, {}, { reply: '', suggestion: { kind: 'none', energy: 'none', muscles: [] } },
  { reply: 'x', suggestion: { kind: 'update-week-shift', energy: 'none', muscles: [] } },
  { reply: 'x', suggestion: { kind: 'move', energy: 'none', muscles: ['unknown'] } },
  { reply: 'x', suggestion: { kind: 'move', energy: 'cansado', muscles: ['pecho'] } },
  { reply: 'x', suggestion: { kind: 'none', energy: 'bien', muscles: [] } },
  { reply: 'x', suggestion: { kind: 'energy', energy: 'none', muscles: [] } },
  { reply: 'x', suggestion: { kind: 'energy_move', energy: 'cansado', muscles: ['biceps', 'biceps'] } },
]) {
  let failed = false;
  try { normalizeBrainChatResult(invalid); } catch { failed = true; }
  ok(failed, 'contrato debe rechazar dato ajeno');
}
const history = sanitizeBrainChatHistory(Array.from({ length: 9 }, (_, i) => ({
  role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
  text: 'z'.repeat(1000),
})));
same(history.length, 6, 'solo seis mensajes recientes');
ok(history.every((turn) => turn.text.length <= 600), 'cada turno es corto');
console.log('Brain cloud contract tests passed.');
