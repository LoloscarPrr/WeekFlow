import type { DayState } from '@/src/domain/entities/DailyState';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import { localDateKey } from '@/src/domain/services/shiftSchedule';
import type { FoodDayRecord, MoveSessionRecord } from '@/src/state/persistence';

export type GardenSignal = 'recent' | 'connected' | 'waiting';

export type GardenPlot = {
  id: 'rest' | 'food' | 'move' | 'relations' | 'wellbeing' | 'home' | 'responsibilities' | 'personal';
  title: string;
  icon: string;
  signal: GardenSignal;
  label: string;
  copy: string;
};

export type GardenView = {
  title: string;
  copy: string;
  plots: GardenPlot[];
};

export type GetGardenViewInput = {
  dayState: DayState;
  weekState: WeekSchedule;
  moveHistory: MoveSessionRecord[];
  foodHistory: FoodDayRecord[];
  now: Date;
};

function dayDistance(from: Date, to: Date) {
  const fromDay = new Date(from);
  const toDay = new Date(to);
  fromDay.setHours(0, 0, 0, 0);
  toDay.setHours(0, 0, 0, 0);
  return Math.floor((toDay.getTime() - fromDay.getTime()) / 86_400_000);
}

function hasRecentMove(history: MoveSessionRecord[], now: Date) {
  return history.some((item) => {
    const finished = new Date(item.finishedAt);
    if (Number.isNaN(finished.getTime())) return false;
    const distance = dayDistance(finished, now);
    return distance >= 0 && distance <= 6;
  });
}

function hasRecentFood(history: FoodDayRecord[], now: Date) {
  const today = localDateKey(now);
  return history.some((day) => {
    if (!day.entries.length) return false;
    const date = new Date(`${day.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return day.date === today;
    const distance = dayDistance(date, now);
    return distance >= 0 && distance <= 6;
  });
}

export function getGardenView({
  dayState,
  weekState,
  moveHistory,
  foodHistory,
  now,
}: GetGardenViewInput): GardenView {
  const moveRecent = hasRecentMove(moveHistory, now);
  const foodRecent = hasRecentFood(foodHistory, now);
  const hasWorkingShift = weekState.shifts.some((shift) => shift.type !== 'off');

  const plots: GardenPlot[] = [
    {
      id: 'rest',
      title: 'Descanso',
      icon: '🌙',
      signal: hasWorkingShift ? 'connected' : 'waiting',
      label: hasWorkingShift ? 'Conectado al plan' : 'Esperando horario',
      copy: hasWorkingShift
        ? 'Rest ya usa tus turnos para proteger recuperación y transiciones.'
        : 'Cuando tengas turnos cargados, Rest podrá leer sus ventanas de recuperación.',
    },
    {
      id: 'food',
      title: 'Alimentación',
      icon: '🍲',
      signal: foodRecent ? 'recent' : 'connected',
      label: foodRecent ? 'Señal reciente' : 'Listo para usar',
      copy: foodRecent
        ? 'Hay comidas registradas esta semana. El Jardín solo reconoce la señal; no la puntúa.'
        : 'Food ya puede guiar y registrar comidas cuando lo necesites.',
    },
    {
      id: 'move',
      title: 'Movimiento',
      icon: '🏃',
      signal: moveRecent ? 'recent' : 'connected',
      label: moveRecent ? 'Señal reciente' : 'Listo para usar',
      copy: moveRecent
        ? 'Hay una sesión Move reciente. No hay racha ni castigo si hoy no toca.'
        : 'Move ya está conectado al plan y puede iniciar una sesión guiada.',
    },
    {
      id: 'relations',
      title: 'Relaciones',
      icon: '🤝',
      signal: 'waiting',
      label: 'Aún sin fuente',
      copy: 'Falta una forma simple de registrar o planear tiempo de calidad sin volverlo una obligación.',
    },
    {
      id: 'wellbeing',
      title: 'Bienestar',
      icon: '🌿',
      signal: 'connected',
      label: 'Check-in conectado',
      copy: `Tu energía actual (${dayState.energy}) ya modifica decisiones del Brain. Falta ampliar pausas y regulación.`,
    },
    {
      id: 'home',
      title: 'Hogar',
      icon: '🏠',
      signal: 'waiting',
      label: 'Aún sin fuente',
      copy: 'Falta conectar tareas del hogar en bloques pequeños según tiempo y energía.',
    },
    {
      id: 'responsibilities',
      title: 'Responsabilidades',
      icon: '📌',
      signal: hasWorkingShift ? 'connected' : 'waiting',
      label: hasWorkingShift ? 'Turnos conectados' : 'Aún sin fuente',
      copy: hasWorkingShift
        ? 'El trabajo ya aporta contexto real. Faltan pendientes, trámites, estudio y otras obligaciones.'
        : 'Falta una fuente de pendientes, trámites, estudio y otras obligaciones.',
    },
    {
      id: 'personal',
      title: 'Tiempo personal',
      icon: '✨',
      signal: 'waiting',
      label: 'Aún sin fuente',
      copy: 'Falta representar ocio y espacio propio sin convertir cada rato libre en productividad.',
    },
  ];

  return {
    title: 'Tu jardín no se califica.',
    copy: 'Muestra qué áreas ya tienen señales reales, cuáles están conectadas al Brain y cuáles todavía necesitan una fuente. Nada de puntos ni rachas.',
    plots,
  };
}
