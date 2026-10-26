import { answerDayAdvice, interpretDayAdviceQuestion, type DayAdviceState } from '../src/assistant/dayAdvice';
import { DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message + ': ' + JSON.stringify(actual));
}

for (const phrase of [
  '¿Me conviene entrenar hoy?', '¿Puedo entrenar hoy?',
  '¿Tengo tiempo para entrenar hoy?', '¿Entreno o descanso hoy?',
  '¿Cuándo puedo entrenar hoy?',
]) equal(interpretDayAdviceQuestion(phrase), 'training', 'consulta Move: ' + phrase);

for (const phrase of [
  '¿Cómo organizo mi día?', '¿Qué priorizo hoy?', '¿Qué hago primero hoy?',
]) equal(interpretDayAdviceQuestion(phrase), 'balance', 'consulta del día: ' + phrase);
equal(interpretDayAdviceQuestion('¿Qué priorizo entre el turno y el descanso?'), 'recovery', 'Rest y trabajo');
for (const phrase of [
  'quiero entrenar pecho', 'estoy cansado', 'salí una hora tarde',
  'mañana quiero entrenar', '¿Me conviene entrenar mañana?',
  '¿Cómo organizo mi semana?', 'Cambia el turno y programa Move',
  '¿Qué ejercicios de espalda debo hacer?', 'no alcanzo a entrenar', '',
]) equal(interpretDayAdviceQuestion(phrase), null, 'no convertir una orden/futuro en consulta actual: ' + phrase);

const base: DayAdviceState = {
  energy: 'bien',
  phase: 'off',
  mode: 'day-off',
  jornadaLabel: 'Libre',
  needsExitReview: false,
  moveDoneToday: false,
  upcomingMoments: [{ type: 'move', time: '16:00', title: 'Move sugerido' }],
  restTitle: 'Próximo descanso',
  restMeta: 'Sin presión',
  postNightRecovery: false,
  preferences: DEFAULT_MOVE_PREFERENCES,
  previousFeedback: null,
  previousEndedEarly: false,
};
const snapshot = JSON.stringify(base);
const happy = answerDayAdvice('training', base);
ok(happy.includes('Cuerpo completo') && happy.includes('16:00'), 'usa el momento real de Ahora');
ok(happy.includes('no es una reserva confirmada'), 'distingue sugerencia de reserva');
ok(!happy.includes('guardé') && !happy.includes('programé'), 'no simula persistencia');
equal(JSON.stringify(base), snapshot, 'responder no muta fuentes');
ok(answerDayAdvice('balance', base).includes('Rest: Próximo descanso'), 'balance incluye Rest');
ok(answerDayAdvice('balance', base).includes('jornada activa'), 'balance incluye turno canónico');

const noSlot = answerDayAdvice('training', { ...base, upcomingMoments: [] });
ok(noSlot.includes('No hay una hora libre'), 'sin hueco no inventar horario');
ok(!noSlot.includes('16:00'), 'no cita sugerencias previas');
ok(answerDayAdvice('training', { ...base, moveDoneToday: true }).includes('ya registra una sesión'), 'historial Move tiene prioridad');
ok(answerDayAdvice('training', { ...base, energy: 'agotado' }).includes('prioridad es recuperarte'), 'agotamiento prioriza recuperación');
ok(answerDayAdvice('training', { ...base, phase: 'working', mode: 'workday', jornadaLabel: '09:00–17:00' }).includes('jornada o traslado está en curso'), 'no entrena durante trabajo');
ok(answerDayAdvice('balance', { ...base, phase: 'before', mode: 'workday', jornadaLabel: '12:00–20:00' }).includes('preparación y el traslado'), 'protege traslado');
ok(answerDayAdvice('training', { ...base, mode: 'night-shift', phase: 'after' }).includes('Primero descanso'), 'después de jornada nocturna priorizar descanso');
ok(answerDayAdvice('training', { ...base, postNightRecovery: true }).includes('Primero descanso'), 'arrastre de sueño nocturno protege Rest');
ok(answerDayAdvice('training', { ...base, needsExitReview: true }).includes('reajuste pendiente'), 'bloquea sugerencias durante salida sin validar');

const incompatible: DayAdviceState = {
  ...base,
  preferences: { ...DEFAULT_MOVE_PREFERENCES, targetMuscles: ['biceps'], avoidAreas: ['wrists'] },
};
ok(answerDayAdvice('training', incompatible).includes('No encontré ejercicios compatibles'), 'respeta equipo y lesiones/limitaciones registradas');

console.log('Brain offline cross-module advice regression tests passed.');
