import type { Energy } from '../domain/entities/DailyState';
import type { BrainMoment, BrainPlan } from '../domain/entities/Planning';
import type { MovePreferences } from '../move/adaptation';
import { recommendMoveIntensity } from '../move/adaptation';
import { compatibleTargetedExercises } from '../move/library';
import { describeTargetMuscles } from '../move/muscles';

// Solo consultas. Las declaraciones y órdenes continúan pasando por Brain Actions.
export type DayAdviceQuestion = 'balance' | 'training' | 'recovery';

function normalized(input: string) {
  return input.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

export function interpretDayAdviceQuestion(input: string): DayAdviceQuestion | null {
  const text = normalized(input);
  if (!text || /\b(manana|pasado manana|ayer|anteayer|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(text)) return null;
  if (/\b(cambia|cambiar|modifica|registrar|registra|mueve|programa|agendar|agendame|ponme|hazme|preparame|armame|salgo|sali|entro)\b/.test(text)) return null;
  // No absorber pedidos de rutinas específicas o mensajes con datos nuevos.
  if (/\b(quiero entrenar|quiero ejercitar|rutina de|ejercicios de|estoy cansad[oa]|estoy agotad[oa])\b/.test(text)) return null;
  const question = /[¿?]/.test(input) || /^(que|como|cuando|puedo|conviene|deberia|entreno o|tengo tiempo|me da tiempo|vale la pena|es mejor|priorizo)/.test(text);
  if (!question) return null;

  if (/\b(entrenar|entrenamiento|ejercicio|entreno|move|rutina)\b/.test(text)
    && /\b(puedo|conviene|deberia|tiempo|hueco|momento|hoy|descansar|descanso|priorizo|cuando)\b/.test(text)) return 'training';
  if (/\b(descansar|descanso|recuperar|recuperacion|dormir|rest)\b/.test(text)
    && /\b(turno|trabajo|jornada|priorizo|primero|conviene|despues|ahora)\b/.test(text)) return 'recovery';
  if (/\b(organizo|organizar|planifico|planificar|priorizo|prioridad|primero|mi dia|hago hoy|que hago ahora|dia de hoy)\b/.test(text)) return 'balance';
  return null;
}

export type DayAdviceState = {
  energy: Energy;
  phase: 'off' | 'before' | 'commuting' | 'working' | 'after';
  mode: BrainPlan['mode'];
  jornadaLabel: string;
  needsExitReview: boolean;
  moveDoneToday: boolean;
  upcomingMoments: ReadonlyArray<Pick<BrainMoment, 'type' | 'time' | 'title'>>;
  restTitle: string;
  restMeta: string;
  // Derived from the same canonical Rest view, not inferred from keyworded UI copy.
  postNightRecovery: boolean;
  preferences: MovePreferences;
  previousFeedback?: string | null;
  previousEndedEarly?: boolean;
};

function trainingAdvice(state: DayAdviceState) {
  if (state.needsExitReview) {
    return 'Antes de planificar entrenamiento, revisa en Ahora el reajuste pendiente de tu salida real. No voy a reservar un horario con esa información sin confirmar.';
  }
  if (state.postNightRecovery || (state.mode === 'night-shift' && state.phase === 'after')) {
    return 'Primero descanso y recuperación: Rest protege la salida de un turno nocturno. No recomiendo añadir una sesión en esa ventana.';
  }
  if (state.phase === 'working' || state.phase === 'commuting') {
    return state.mode === 'night-shift'
      ? 'Estás en una jornada nocturna o su traslado. Termina el turno y protege el descanso antes de pensar en Move.'
      : 'Tu jornada o traslado está en curso. No hay un hueco de entrenamiento confirmado ahora; después revisa Move y el descanso real.';
  }
  if (state.moveDoneToday) return 'Move ya registra una sesión terminada hoy. No necesitas sumar otra para cumplir.';
  if (state.energy === 'agotado') return 'Registraste energía agotada. Hoy la prioridad es recuperarte; no es necesario forzar una rutina.';
  const intensity = recommendMoveIntensity(
    state.energy,
    state.preferences.experience,
    state.previousFeedback,
    Boolean(state.previousEndedEarly),
  );
  if (state.preferences.targetMuscles.length
    && !compatibleTargetedExercises(state.preferences, intensity).length) {
    return 'No encontré ejercicios compatibles con los músculos, equipo y restricciones actuales. Ajusta el perfil en Move; no voy a recomendar una rutina incompatible.';
  }
  const target = describeTargetMuscles(state.preferences.targetMuscles);
  const intensityLabel = intensity === 'recuperacion' ? 'de recuperación' : intensity;
  const planMoment = state.upcomingMoments.find((item) => item.type === 'move');
  const suggestedTime = planMoment
    ? ` Ahora muestra una sugerencia de Move a las ${planMoment.time} (${planMoment.title}); aún no es una reserva confirmada.`
    : ' No hay una hora libre de entrenamiento confirmada en la planificación actual.';
  return `Move puede adaptar una sesión de ${target} a intensidad ${intensityLabel} según tu energía y feedback.${suggestedTime} Revisa el tiempo disponible y la rutina antes de empezar.`;
}

export function answerDayAdvice(question: DayAdviceQuestion, state: DayAdviceState): string {
  const work = state.phase === 'off'
    ? 'Hoy no hay una jornada activa en Ahora.'
    : state.phase === 'working'
      ? `Ahora estás trabajando (${state.jornadaLabel}).`
      : state.phase === 'commuting'
        ? `Estás en traslado o preparación de tu jornada (${state.jornadaLabel}).`
        : state.phase === 'before'
          ? `Tienes una jornada prevista (${state.jornadaLabel}); la preparación y el traslado van primero.`
          : `La jornada ${state.jornadaLabel} aparece terminada en Ahora.`;
  const rest = `Rest: ${state.restTitle}${state.restMeta ? ' · ' + state.restMeta : ''}.`;
  if (question === 'training') return trainingAdvice(state);
  if (question === 'recovery') return [work, rest, trainingAdvice(state)].join(' ');
  return [work, rest, trainingAdvice(state)].join(' ');
}
