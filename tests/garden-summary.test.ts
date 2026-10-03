import { buildGardenPillars, foodMomentsThisWeek, moveSessionsThisWeek } from '../src/garden/summary';
import type { RestView } from '../src/application/useCases/getRestView';
import type { FoodDayRecord, MoveSessionRecord } from '../src/state/persistence';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
}

const now = new Date(2026, 9, 2, 12, 0);
const moveHistory: MoveSessionRecord[] = [
  {
    id: 'this-week',
    startedAt: new Date(2026, 8, 30, 10, 0).toISOString(),
    finishedAt: new Date(2026, 8, 30, 10, 20).toISOString(),
    plannedMinutes: 20,
    completedSteps: 4,
    totalSteps: 4,
    endedEarly: false,
    feedback: null,
  },
  {
    id: 'last-week',
    startedAt: new Date(2026, 8, 27, 10, 0).toISOString(),
    finishedAt: new Date(2026, 8, 27, 10, 20).toISOString(),
    plannedMinutes: 20,
    completedSteps: 4,
    totalSteps: 4,
    endedEarly: false,
    feedback: null,
  },
];

const foodHistory: FoodDayRecord[] = [
  { date: '2026-10-01', entries: [{ id: 'a', at: '12:00', label: 'Almuerzo', source: 'manual' }, { id: 'b', at: '20:00', label: 'Cena', source: 'manual' }] },
  { date: '2026-09-27', entries: [{ id: 'old', at: '12:00', label: 'Almuerzo', source: 'manual' }] },
];

equal(moveSessionsThisWeek(moveHistory, now), 1, 'solo cuenta Move de la semana local actual');
equal(foodMomentsThisWeek(foodHistory, now), 2, 'solo cuenta momentos Food de la semana local actual');

const restView: RestView = {
  heroTitle: 'Descanso',
  contextTitle: 'Próximo turno',
  contextCopy: 'Plan real',
  contextMeta: 'Próxima entrada',
  content: {
    kind: 'plan',
    sectionTitle: 'PRÓXIMO DESCANSO',
    plan: { windDownAt: 'jue · 01:25', sleepAt: '02:10', wakeAt: '10:10', nextStart: '13:00', nap: null },
  },
};

const pillars = buildGardenPillars({ moveHistory, foodHistory, restView, now });
equal(pillars.length, 8, 'Jardín conserva los ocho pilares canónicos');
equal(pillars.find((item) => item.key === 'move')?.evidence, '1 sesión esta semana.', 'Movimiento muestra evidencia real');
equal(pillars.find((item) => item.key === 'food')?.evidence, '2 momentos registrados esta semana.', 'Food muestra evidencia real');
equal(pillars.find((item) => item.key === 'rest')?.status, 'Equilibrado', 'Rest con plan usa estado amable');
equal(pillars.find((item) => item.key === 'relationships')?.status, 'Sin datos', 'no inventa estado para pilares sin fuente');

const empty = buildGardenPillars({
  moveHistory: [],
  foodHistory: [],
  restView: { ...restView, content: { kind: 'empty', sectionTitle: 'PRÓXIMO DESCANSO' } },
  now,
});
equal(empty.find((item) => item.key === 'move')?.status, 'Necesita atención', '0 sesiones se expresa sin score');
equal(empty.find((item) => item.key === 'food')?.status, 'Necesita atención', '0 registros se expresa sin score');
equal(empty.find((item) => item.key === 'rest')?.status, 'Sin datos', 'Rest sin plan no inventa descanso');

console.log('✓ Jardín resume pilares con evidencia real, sin score ni datos inventados');
