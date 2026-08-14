import { addMinutes, formatMinutes, toMinutes } from '@/src/domain/services/time';
import type { BrainMoment, BrainPlan, BrainSnapshot } from './types';

function moment(time: string, icon: string, title: string, detail: string, type: BrainMoment['type'], flexible = true): BrainMoment {
  return { time, icon, title, detail, type, flexible };
}

function isNightShift(snapshot: BrainSnapshot) {
  const { shift } = snapshot;
  if (shift.type === 'night') return true;
  if (shift.type === 'off') return false;
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  return start >= 18 * 60 || end <= 8 * 60 || end < start;
}

function preShift(snapshot: BrainSnapshot) {
  const leave = addMinutes(snapshot.shift.start, -(snapshot.commuteOutMin + snapshot.bufferMin));
  const prep = addMinutes(leave, -snapshot.prepMin);
  const meal = addMinutes(prep, -snapshot.mealMin);
  const wake = addMinutes(meal, -20);
  return { wake, meal, prep, leave };
}

function buildFreeDay(snapshot: BrainSnapshot): BrainPlan {
  const movement = snapshot.energy === 'vigoroso'
    ? moment('10:30', '🏃', 'Move · 25 min', 'Tienes energía: aprovechamos sin llenar el día.', 'move')
    : snapshot.energy === 'agotado'
      ? moment('11:15', '🌿', 'Recuperación suave', 'Hoy descansar también cuenta.', 'rest')
      : snapshot.energy === 'cansado'
        ? moment('11:00', '🧘', 'Movilidad · 8 min', 'Algo pequeño y realizable.', 'move')
        : moment('10:45', '🏃', 'Move · 15 min', 'Sesión breve y adaptable.', 'move');

  const moments = [
    moment('09:00', '☀️', 'Despertar sin apuro', 'Día libre: dejamos margen real.', 'wake', false),
    moment('09:30', '🍽️', 'Desayuno', 'Primero comer; después decidir.', 'food'),
    movement,
    moment('13:30', '🍲', 'Almuerzo', 'Bloque de comida protegido.', 'food'),
    moment('16:30', '🌿', 'Espacio sin plan', 'No todo hueco necesita una tarea.', 'personal', false),
    moment('18:00', '❤️', 'Vida personal', 'Relaciones, hogar o tiempo para ti.', 'personal'),
    moment('23:30', '😴', 'Cerrar el día', 'Bajamos revoluciones con margen.', 'rest', false),
  ];

  return {
    mode: 'day-off',
    headline: snapshot.energy === 'agotado' ? 'Recuperar sin culpa' : 'Día libre con espacio real',
    summary: 'WeekFlow no llena el día por llenarlo. Protege lo importante y deja aire.',
    primary: movement,
    moments,
  };
}

function buildWorkDay(snapshot: BrainSnapshot): BrainPlan {
  const pre = preShift(snapshot);
  const backHome = addMinutes(snapshot.shift.end, snapshot.commuteBackMin);
  const recovery = addMinutes(backHome, snapshot.recoveryMin);
  const moments = [
    moment(pre.wake, '☀️', 'Despertar', `Calculado desde tu entrada a las ${snapshot.shift.start}.`, 'wake', false),
    moment(pre.meal, '🍽️', 'Comer antes de la jornada', 'Un bloque breve antes de prepararte.', 'food'),
    moment(pre.prep, '🚿', 'Prepararte', `${snapshot.prepMin} min reservados.`, 'prep', false),
    moment(pre.leave, '🚇', 'Salir hacia el trabajo', `${snapshot.commuteOutMin} min de traslado + ${snapshot.bufferMin} min de margen.`, 'commute-out', false),
    moment(snapshot.shift.start, '💼', 'Jornada de trabajo', `${snapshot.shift.start}–${snapshot.shift.end}`, 'work', false),
    moment(snapshot.shift.end, '🚇', 'Regreso a casa', `${snapshot.commuteBackMin} min estimados de regreso.`, 'commute-back', false),
    moment(recovery, '🧠', 'Descompresión', 'Bajar revoluciones después de llegar.', 'recovery'),
  ];
  if (snapshot.energy !== 'agotado') moments.push(moment(addMinutes(recovery, 45), '🍽️', 'Comer / recuperar', 'Bloque simple después de la jornada.', 'food'));
  return {
    mode: 'workday',
    headline: 'Tu jornada marca el ritmo',
    summary: 'El Brain calcula hacia atrás para que llegar al trabajo no destruya el resto del día.',
    primary: moment(pre.leave, '🚇', 'Salir a tiempo', `Salida sugerida: ${pre.leave}.`, 'commute-out', false),
    moments,
  };
}

function buildNightShift(snapshot: BrainSnapshot): BrainPlan {
  const pre = preShift(snapshot);
  const home = addMinutes(snapshot.shift.end, snapshot.commuteBackMin);
  const recovery = addMinutes(home, snapshot.recoveryMin);
  const sleep = addMinutes(recovery, 30);
  const moments = [
    moment(pre.wake, '☀️', 'Despertar / activarte', 'Calculado hacia atrás desde la jornada nocturna.', 'wake', false),
    moment(pre.meal, '🍲', 'Comer antes de la jornada', 'Evitar improvisar durante la noche.', 'food'),
    moment(pre.prep, '🚿', 'Prepararte', `${snapshot.prepMin} min reservados.`, 'prep', false),
    moment(pre.leave, '🚇', 'Salir hacia el trabajo', `${snapshot.commuteOutMin} min de traslado + ${snapshot.bufferMin} min de margen.`, 'commute-out', false),
    moment(snapshot.shift.start, '💼', 'Jornada de trabajo', `${snapshot.shift.start}–${snapshot.shift.end}`, 'work', false),
    moment(snapshot.shift.end, '🚇', 'Regreso a casa', `${snapshot.commuteBackMin} min estimados de regreso.`, 'commute-back', false),
    moment(recovery, '🧠', 'Bajar revoluciones', 'Después de la noche, Rest gana prioridad.', 'recovery'),
    moment(sleep, '😴', 'Dormir / recuperar', 'Protegemos recuperación antes de añadir extras.', 'rest', false),
  ];
  return {
    mode: 'night-shift',
    headline: 'Primero recuperarte',
    summary: 'En una jornada nocturna, WeekFlow protege sueño y recuperación antes de colocar lo flexible.',
    primary: moment(sleep, '😴', 'Dormir / recuperar', `Ventana sugerida desde ${sleep}.`, 'rest', false),
    moments,
  };
}

export function buildBrainPlan(snapshot: BrainSnapshot): BrainPlan {
  if (snapshot.shift.type === 'off') return buildFreeDay(snapshot);
  return isNightShift(snapshot) ? buildNightShift(snapshot) : buildWorkDay(snapshot);
}

export function replanAfterActualExit(snapshot: BrainSnapshot, currentPlan: BrainPlan, actualExit: string, moveFlexible = true): BrainPlan {
  if (snapshot.shift.type === 'off') return currentPlan;
  const homeAt = addMinutes(actualExit, snapshot.commuteBackMin);
  const recoveryAt = addMinutes(homeAt, snapshot.recoveryMin);
  const restAt = addMinutes(recoveryAt, 30);
  let flexibleCursor = toMinutes(recoveryAt) + 45;
  const commuteBackIndex = currentPlan.moments.findIndex((item) => item.type === 'commute-back');

  const moments = currentPlan.moments.map((item, index) => {
    if (item.type === 'commute-back') return { ...item, time: actualExit, detail: `Salida real ${actualExit} · ${snapshot.commuteBackMin} min estimados de regreso.` };
    if (item.type === 'recovery') {
      flexibleCursor = toMinutes(recoveryAt) + 45;
      return { ...item, time: recoveryAt, detail: 'Reprogramado desde tu salida real. Primero bajar revoluciones.' };
    }
    if (item.type === 'rest' && currentPlan.mode === 'night-shift' && index > commuteBackIndex) {
      return { ...item, time: restAt, detail: 'Ventana de recuperación reajustada desde tu salida real.' };
    }
    if (item.flexible && index > commuteBackIndex && ['food', 'move', 'personal'].includes(item.type)) {
      if (!moveFlexible) return { ...item, detail: `${item.detail} · Nueva hora pendiente de tu confirmación.` };
      const time = formatMinutes(flexibleCursor);
      flexibleCursor += 45;
      return { ...item, time, detail: `${item.detail} · Reprogramado por tu salida real.` };
    }
    return item;
  });

  return {
    ...currentPlan,
    headline: moveFlexible ? 'Jornada terminada · día actualizado' : 'Salida real registrada',
    summary: moveFlexible
      ? `Tomé ${actualExit} como tu salida real y moví solo lo flexible.`
      : `Tomé ${actualExit} como salida real. Regreso y recuperación ya cambiaron; lo flexible espera tu confirmación.`,
    primary: moment(actualExit, '✓', 'Ya saliste', `Regreso estimado a casa: ${homeAt}.`, 'commute-back', false),
    moments,
  };
}

export const brainTime = { toMinutes, formatMinutes, addMinutes };
