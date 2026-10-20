import type { AssistantRealState } from './context';

export type AssistantQuestionTopic = 'now' | 'energy' | 'move' | 'food' | 'rest';

function normalizeQuestion(input: string) {
  return input.trim().toLocaleLowerCase('es-CL')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
}

// A closed list of read-only questions. Unknown statements go to the action parser,
// never to an invented answer or a guessed change.
export function detectAssistantQuestion(input: string): AssistantQuestionTopic | null {
  const text = normalizeQuestion(input);
  if (/^(?:que (?:sigue|toca|viene)(?: ahora| hoy)?|que tengo (?:ahora|hoy)|que deberia hacer (?:ahora|hoy)|cual es (?:mi )?(?:proximo|siguiente) paso)$/.test(text)) {
    return 'now';
  }
  if (/^(?:como (?:esta|va) mi energia|como voy (?:de|con)(?: mi)? energia|que energia tengo(?: hoy)?|como esta mi energia hoy)$/.test(text)) {
    return 'energy';
  }
  if (/^(?:ya entrene hoy|entrene hoy|hice (?:move|ejercicio) hoy|como voy con (?:move|el entrenamiento)(?: hoy)?)$/.test(text)) {
    return 'move';
  }
  if (/^(?:comi hoy|ya comi hoy|que he comido hoy|como voy con (?:food|la comida)(?: hoy)?|que registre de comida hoy)$/.test(text)) {
    return 'food';
  }
  if (/^(?:como (?:va|esta) mi descanso|como voy con (?:rest|el descanso)|que pasa con mi descanso|que dice rest(?: hoy)?)$/.test(text)) {
    return 'rest';
  }
  return null;
}

function sentence(main: string, detail: string) {
  const trimmed = detail.trim();
  return trimmed ? main + ' · ' + trimmed : main;
}

export function answerAssistantQuestion(topic: AssistantQuestionTopic, state: AssistantRealState): string {
  switch (topic) {
    case 'now':
      return sentence('Ahora: ' + state.liveTitle, state.liveMeta);
    case 'energy':
      return 'Energía registrada: ' + state.energyLabel + '.';
    case 'move':
      return 'Move: ' + state.move.label + '.';
    case 'food':
      // A Food entry is a record, not proof that something was actually eaten.
      return sentence('Food: ' + state.food.label, state.food.lastTitle ? 'Último registro: ' + state.food.lastTitle : '');
    case 'rest':
      return sentence('Rest: ' + state.rest.title, state.rest.meta);
  }
}
