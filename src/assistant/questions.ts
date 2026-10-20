import type { AssistantRealState } from './context';

// Preguntas explícitas, no comandos. Usa el contexto canónico del Asistente.
export type AssistantQuestion = 'now' | 'move' | 'food' | 'rest' | 'energy';

function normalizedQuestion(input: string) {
  return input.trim()
    .toLocaleLowerCase('es-CL')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^[¿?¡!\s]+|[¿?¡!.\s]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function interpretAssistantQuestion(input: string): AssistantQuestion | null {
  const text = normalizedQuestion(input);

  if ([
    'que viene ahora', 'que sigue', 'que hago ahora',
    'como va mi dia', 'que viene despues',
  ].includes(text)) return 'now';

  if ([
    'ya entrene hoy', 'he entrenado hoy', 'hice move hoy',
    'ya hice move hoy', 'como voy con move',
  ].includes(text)) return 'move';

  if ([
    'que comi hoy', 'que he comido hoy', 'como voy con food',
    'cuantos registros de comida tengo hoy', 'cuantas comidas registre hoy',
  ].includes(text)) return 'food';

  if ([
    'como voy con rest', 'como voy con el descanso',
    'como voy con mi descanso', 'como va mi descanso',
    'que dice rest',
  ].includes(text)) return 'rest';

  if ([
    'que energia tengo', 'como esta mi energia', 'cual es mi energia',
  ].includes(text)) return 'energy';

  // «Estoy cansado» como declaración conserva su acción; para preguntar
  // sobre esa energía la interrogación debe ser explícita.
  if (/^[¿]/.test(input.trim()) && ['estoy cansado', 'estoy cansada'].includes(text)) {
    return 'energy';
  }
  return null;
}

export function answerAssistantQuestion(question: AssistantQuestion, context: AssistantRealState): string {
  switch (question) {
    case 'now':
      return [context.liveTitle, context.liveMeta].filter(Boolean).join(' · ');
    case 'move':
      return context.move.doneToday
        ? 'Move: ya completaste una sesión hoy.'
        : 'Move: todavía no hay una sesión terminada hoy.';
    case 'food': {
      const count = context.food.countToday;
      if (count === 0) return 'Food: no tienes registros de comida hoy.';
      const countText = count === 1 ? '1 registro hoy' : String(count) + ' registros hoy';
      return context.food.lastTitle
        ? 'Food: ' + countText + '. Último: ' + context.food.lastTitle + '.'
        : 'Food: ' + countText + '.';
    }
    case 'rest':
      return [context.rest.title, context.rest.meta].filter(Boolean).join(' · ');
    case 'energy':
      return 'Energía registrada: ' + context.energyLabel + '.';
  }
}
