import type { BrainActionProposal } from '../brain/actions';
import { parseRelativeExitOffset } from './relativeExit';
import { parseConsumedFood } from './foodLog';
import { localDateKey } from '../domain/services/shiftSchedule';

export type ConversationInterpretation =
  | { status: 'proposal'; proposal: BrainActionProposal }
  | { status: 'actual-exit-intent'; time: string }
  | { status: 'actual-exit-relative-intent'; deltaMinutes: number }
  | { status: 'unsupported'; message: string };

const DAY_NAMES: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  miércoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  sábado: 5,
  domingo: 6,
};

function normalize(input: string) {
  return input.trim().toLocaleLowerCase('es-CL').replace(/\s+/g, ' ');
}

function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

function parseEnergy(text: string) {
  if (/\b(agotado|agotada|muerto|muerta)\b/.test(text)) return 'agotado' as const;
  if (/\b(cansado|cansada|poca energia|poca energía)\b/.test(text)) return 'cansado' as const;
  if (/\b(vigoroso|vigorosa|harta energia|harta energía|mucha energia|mucha energía|con energia|con energía)\b/.test(text)) return 'vigoroso' as const;
  if (/\b(estoy bien|ando bien|me siento bien)\b/.test(text)) return 'bien' as const;
  return null;
}

function parseDay(text: string, now: Date) {
  if (/\bmañana\b/.test(text)) return (mondayBasedDay(now) + 1) % 7;
  if (/\bhoy\b/.test(text)) return mondayBasedDay(now);
  for (const [name, day] of Object.entries(DAY_NAMES)) {
    if (new RegExp(`\\b${name}\\b`).test(text)) return day;
  }
  return null;
}

function parseTime(text: string) {
  const match = /\b(?:a\s+las?\s+)?(\d{1,2})(?::([0-5]\d))?\b/.exec(text);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2] ?? '00');
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function interpretAssistantText(input: string, now = new Date()): ConversationInterpretation {
  const text = normalize(input);
  if (!text) return { status: 'unsupported', message: 'Escribe qué cambió y lo reviso.' };

  // Past-tense real departure is not a planned Week shift change.
  // Be conservative: no implicit hour, previous-day report or multi-action guess.
  const consumedFood = parseConsumedFood(input);
  if (consumedFood) {
    return {
      status: 'proposal',
      proposal: {
        id: `assistant-food-${now.getTime()}`,
        kind: 'log-food-entry',
        title: 'Registrar en Food',
        explanation: `Agregar «${consumedFood}» a tus registros de hoy. No estimaré porciones ni calorías.`,
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: { title: consumedFood, date: localDateKey(now) },
      },
    };
  }

  const isActualExit = /\b(?:salí|sali|terminé\s+(?:mi\s+)?turno|termine\s+(?:mi\s+)?turno)(?=\s|$|[.,;!?])/.test(text);
  const energy = parseEnergy(text);
  if (isActualExit) {
    if (/\b(?:ayer|anteayer|mañana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/.test(text)) {
      return { status: 'unsupported', message: 'Por ahora puedo registrar solo la salida real de la jornada actual.' };
    }
    if (energy || /\b(?:entro|entrada|empiezo|salgo)\b/.test(text) || /\b(?:y\s+(?:después|despues|también|tambien|luego|entro|salgo))\b/.test(text)) {
      return { status: 'unsupported', message: 'Dime solamente la salida real con su hora.' };
    }
    // Solo frases inequívocas: «salí una hora tarde» / «terminé mi turno 30 min antes».
    // La hora final se resuelve contra el término FECHADO del turno en el controller.
    if (/\bno\s+(?:salí|sali|terminé|termine)(?=\s|$|[.,;!?])/.test(text)) {
      return { status: 'unsupported', message: 'No registré la salida. Dime qué pasó cuando realmente termines.' };
    }
    const relativePhrase = /^(?:hoy\s+)?(?:salí|sali|terminé\s+(?:mi\s+)?turno|termine\s+(?:mi\s+)?turno)\s+(.+)$/.exec(text);
    if (relativePhrase) {
      const deltaMinutes = parseRelativeExitOffset(relativePhrase[1]);
      if (deltaMinutes !== null) return { status: 'actual-exit-relative-intent', deltaMinutes };
      if (!/^a\s+las?\s+\d{1,2}(?::\d{2})?[.!?]*$/.test(relativePhrase[1])) {
        return { status: 'unsupported', message: 'Dime una hora exacta o cuánto antes/después saliste.' };
      }
    }
    const hourMatch = /\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?(?![:\d])\b/.exec(text);
    if (!hourMatch || Number(hourMatch[1]) > 23 || Number(hourMatch[2] ?? '0') > 59) {
      return { status: 'unsupported', message: 'Indícame la hora real, por ejemplo “hoy salí a las 22:30”.' };
    }
    const time = `${hourMatch[1].padStart(2, '0')}:${(hourMatch[2] ?? '00').padStart(2, '0')}`;
    return { status: 'actual-exit-intent', time };
  }
  if (energy) {
    return {
      status: 'proposal',
      proposal: {
        id: `assistant-energy-${now.getTime()}`,
        kind: 'set-energy',
        title: 'Actualizar energía de hoy',
        explanation: `Entendí que tu energía actual está ${energy}. Esto ajustará el estado que usa Ahora y el Brain.`,
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: { energy },
      },
    };
  }

  const isEntry = /\b(entro|entrada|empiezo)\b/.test(text);
  const isExit = /\b(salgo|salida|termino|termina)\b/.test(text);
  if (isEntry || isExit) {
    if (isEntry && isExit) {
      return { status: 'unsupported', message: 'Entendí entrada y salida a la vez. Dime un solo cambio por mensaje.' };
    }
    const day = parseDay(text, now);
    const time = parseTime(text);
    if (day === null || !time) {
      return { status: 'unsupported', message: 'Necesito un día y una hora claros, por ejemplo “mañana entro a las 10:00”.' };
    }
    const field = isEntry ? 'start' : 'end';
    return {
      status: 'proposal',
      proposal: {
        id: `assistant-shift-${now.getTime()}`,
        kind: 'update-week-shift',
        title: isEntry ? 'Cambiar hora de entrada' : 'Cambiar hora de salida',
        explanation: `Entendí un cambio de ${isEntry ? 'entrada' : 'salida'} a las ${time}. Semana seguirá siendo la fuente de verdad después de confirmar.`,
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: {
          day,
          patch: field === 'start' ? { start: time } : { end: time },
        },
      },
    };
  }

  return {
    status: 'unsupported',
    message: 'Todavía no puedo registrar eso. Entiendo comidas de hoy, energía y cambios claros de horario.',
  };
}
