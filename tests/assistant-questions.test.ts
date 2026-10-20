import { buildAssistantRealState } from '../src/assistant/context';
import { answerAssistantQuestion, interpretAssistantQuestion } from '../src/assistant/questions';
import { defaultDayState, defaultUserProfile } from '../src/domain/defaults';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(message + ': esperaba ' + String(expected) + ', recibí ' + String(actual));
  }
}
function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

for (const [phrase, answer] of [
  ['¿Qué viene ahora?', 'now'],
  ['QUÉ SIGUE?', 'now'],
  ['¿Cómo va mi día?', 'now'],
  ['¿Ya entrené hoy?', 'move'],
  ['¿He entrenado hoy?', 'move'],
  ['¿Qué comí hoy?', 'food'],
  ['¿Cuántas comidas registré hoy?', 'food'],
  ['¿Cómo voy con el descanso?', 'rest'],
  ['¿Qué dice Rest?', 'rest'],
  ['¿Qué energía tengo?', 'energy'],
  ['¿Estoy cansado?', 'energy'],
] as const) {
  equal(interpretAssistantQuestion(phrase), answer, 'pregunta acotada: ' + phrase);
}

for (const text of [
  'estoy cansado',
  'mañana entro a las 10:00',
  'salí una hora tarde',
  '¿mañana entro a las 10:00?',
  '¿Qué comí ayer?',
  '¿Qué comí hoy y salgo a las 20?',
  'no alcanzo a entrenar',
  '',
]) {
  equal(interpretAssistantQuestion(text), null, 'no convierte órdenes o frases vagas en preguntas: ' + text);
}

const now = new Date(2026, 9, 20, 10, 0);
const base = buildAssistantRealState({
  profile: defaultUserProfile,
  dayState: defaultDayState,
  moveHistory: [],
  foodDay: { date: '2026-10-20', entries: [] },
  nowView: {
    live: { title: 'Día despejado', blue: 'Sin pendientes inmediatos' },
    jornadaLabel: 'Libre',
    phase: 'off',
  },
  restView: { contextTitle: 'Día abierto', contextMeta: 'Sin presión.' },
  now,
});
const before = JSON.stringify(base);
equal(answerAssistantQuestion('now', base), 'Día despejado · Sin pendientes inmediatos', 'Ahora usa estado real');
equal(answerAssistantQuestion('move', base), 'Move: todavía no hay una sesión terminada hoy.', 'sin entreno registrado no inventa sesión');
equal(answerAssistantQuestion('food', base), 'Food: no tienes registros de comida hoy.', 'Food vacío no inventa comidas');
equal(answerAssistantQuestion('rest', base), 'Día abierto · Sin presión.', 'Rest responde con estado real');
equal(answerAssistantQuestion('energy', base), 'Energía registrada: Bien.', 'energía responde estado canónico');
equal(JSON.stringify(base), before, 'las respuestas no mutan el contexto');

const training = new Date(now);
training.setHours(8, 30, 0, 0);
const food1 = new Date(now);
food1.setHours(8, 45, 0, 0);
const food2 = new Date(now);
food2.setHours(9, 15, 0, 0);
const detailed = buildAssistantRealState({
  profile: defaultUserProfile,
  dayState: { ...defaultDayState, energy: 'cansado' },
  moveHistory: [{ finishedAt: training.toISOString() }],
  foodDay: { date: '2026-10-20', entries: [
    { id: '2', at: food2.toISOString(), title: 'Yogur', kind: 'snack', source: 'manual' },
    { id: '1', at: food1.toISOString(), title: 'Desayuno', kind: 'meal', source: 'manual' },
  ] },
  nowView: {
    live: { title: 'Trabajando ahora', blue: '10:00–18:00 · Jornada en curso' },
    jornadaLabel: 'Turno tarde',
    phase: 'working',
  },
  restView: { contextTitle: 'Recuperación pendiente', contextMeta: 'Después del turno.' },
  now,
});
equal(answerAssistantQuestion('move', detailed), 'Move: ya completaste una sesión hoy.', 'Move completado detectado');
equal(answerAssistantQuestion('food', detailed), 'Food: 2 registros hoy. Último: Yogur.', 'Food informa último por orden cronológico');
equal(answerAssistantQuestion('rest', detailed), 'Recuperación pendiente · Después del turno.', 'Rest no duplica planificación');
equal(answerAssistantQuestion('energy', detailed), 'Energía registrada: Cansado.', 'energía no inventa');
ok(!answerAssistantQuestion('now', detailed).includes('Día despejado'), 'Ahora cambia con estado real');

console.log('Assistant bounded read-only questions passed.');
