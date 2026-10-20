import { answerAssistantQuestion, detectAssistantQuestion } from '../src/assistant/questions';
import type { AssistantRealState } from '../src/assistant/context';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
}
function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const state: AssistantRealState = {
  generatedAt: '2026-10-20T20:15:00.000Z',
  name: null,
  energy: 'bien',
  energyLabel: 'Bien',
  liveTitle: 'Trabajando ahora',
  liveMeta: '13:00–22:00 · Jornada en curso',
  jornadaLabel: 'Tarde',
  phase: 'working',
  move: { doneToday: false, label: 'Sin sesión terminada hoy' },
  food: { countToday: 0, label: 'Sin registros hoy', lastTitle: null },
  rest: { title: 'Recuperación post-turno', meta: 'Descanso después del trabajo' },
};

for (const [input, topic] of [
  ['¿Qué sigue?', 'now'],
  ['QUÉ TOCA AHORA?', 'now'],
  ['¿Cómo está mi energía?', 'energy'],
  ['¿Cómo voy con mi energía?', 'energy'],
  ['¿Entrené hoy?', 'move'],
  ['¿Ya entrené hoy?', 'move'],
  ['¿Comí hoy?', 'food'],
  ['¿Cómo voy con Food?', 'food'],
  ['¿Cómo va mi descanso?', 'rest'],
  ['¿Qué dice Rest?', 'rest'],
] as const) {
  equal(detectAssistantQuestion(input), topic, 'pregunta ' + input);
}
for (const unknown of [
  'hoy estoy cansado',
  'salí una hora tarde',
  'mañana entro a las 10',
  'no alcanzo a entrenar',
  '¿Qué hago en 3 días?',
  '¿Me puedes inventar una rutina?',
  '¿Cómo voy con mis finanzas?',
  '',
]) {
  equal(detectAssistantQuestion(unknown), null, 'no inventar consulta ' + unknown);
}

equal(answerAssistantQuestion('now', state), 'Ahora: Trabajando ahora · 13:00–22:00 · Jornada en curso', 'Ahora usa realidad');
equal(answerAssistantQuestion('energy', state), 'Energía registrada: Bien.', 'energía actual');
equal(answerAssistantQuestion('move', state), 'Move: Sin sesión terminada hoy.', 'sin historial Move no inventa entrenamiento');
equal(answerAssistantQuestion('food', state), 'Food: Sin registros hoy', 'sin historial Food no inventa ingesta');
equal(answerAssistantQuestion('rest', state), 'Rest: Recuperación post-turno · Descanso después del trabajo', 'Rest real');

const nextState: AssistantRealState = {
  ...state,
  energy: 'cansado',
  energyLabel: 'Cansado',
  liveTitle: 'Descanso ahora',
  liveMeta: 'Sin próximo turno inmediato',
  move: { doneToday: true, label: 'Hecho hoy' },
  food: { countToday: 2, label: '2 registros hoy', lastTitle: 'Yogur' },
  rest: { title: 'Pausa corta', meta: '' },
};
equal(answerAssistantQuestion('energy', nextState), 'Energía registrada: Cansado.', 'refleja cambios canónicos');
equal(answerAssistantQuestion('now', nextState), 'Ahora: Descanso ahora · Sin próximo turno inmediato', 'Ahora cambia con estado');
equal(answerAssistantQuestion('move', nextState), 'Move: Hecho hoy.', 'Move completado');
equal(answerAssistantQuestion('food', nextState), 'Food: 2 registros hoy · Último registro: Yogur', 'Food declara registro, no nutrición ingerida');
equal(answerAssistantQuestion('rest', nextState), 'Rest: Pausa corta', 'sin meta Rest no deja separador');
ok(!answerAssistantQuestion('food', nextState).includes('comiste'), 'registros no son prueba de que comió');

console.log('Assistant canonical-state question tests passed.');
