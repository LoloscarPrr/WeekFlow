import { buildGardenPillars, foodMomentsThisWeek, moveSessionsThisWeek } from '../src/garden/summary';
import { formatGardenDays, sanitizeGardenPreferences } from '../src/garden/preferences';
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
  { date: '2026-10-01', entries: [
    { id: 'a', at: new Date(2026, 9, 1, 12, 0).toISOString(), title: 'Almuerzo', kind: 'meal', source: 'manual' },
    { id: 'b', at: new Date(2026, 9, 1, 20, 0).toISOString(), title: 'Cena', kind: 'meal', source: 'manual' },
  ] },
  { date: '2026-09-27', entries: [
    { id: 'old', at: new Date(2026, 8, 27, 12, 0).toISOString(), title: 'Almuerzo', kind: 'meal', source: 'manual' },
  ] },
];

equal(moveSessionsThisWeek(moveHistory, now), 1, 'solo cuenta Move de la semana local actual');
equal(foodMomentsThisWeek(foodHistory, now), 2, 'solo cuenta momentos Food de la semana local actual');
equal(formatGardenDays([2, 6]), 'Mar · Sáb', 'formatea días configurados sin convertirlos en score');

const sanitized = sanitizeGardenPreferences({ relationships: { days: [6, 2, 2, 99] }, bogus: { days: [1] } });
equal(sanitized.relationships?.days.join(','), '2,6', 'sanea y ordena los días configurados');
equal(Object.keys(sanitized).length, 1, 'ignora pilares desconocidos');

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

const pillars = buildGardenPillars({
  moveHistory,
  foodHistory,
  restView,
  preferences: { relationships: { days: [2, 6] } },
  now,
});
equal(pillars.length, 8, 'Jardín conserva los ocho pilares canónicos');
equal(pillars.find((item) => item.key === 'move')?.evidence, '1 sesión esta semana.', 'Movimiento muestra evidencia real');
equal(pillars.find((item) => item.key === 'food')?.evidence, '2 momentos registrados esta semana.', 'Food muestra evidencia real');
equal(pillars.find((item) => item.key === 'rest')?.status, 'Equilibrado', 'Rest con plan usa estado amable');
equal(pillars.find((item) => item.key === 'relationships')?.evidence, 'Mar · Sáb', 'Relaciones muestra los días elegidos');
equal(pillars.find((item) => item.key === 'relationships')?.status, 'Planificado', 'configurar no se presenta como cumplimiento');
equal(pillars.find((item) => item.key === 'wellbeing')?.status, 'Sin datos', 'un pilar no configurado sigue sin datos');

const empty = buildGardenPillars({
  moveHistory: [],
  foodHistory: [],
  restView: { ...restView, content: { kind: 'empty', sectionTitle: 'PRÓXIMO DESCANSO' } },
  now,
});
equal(empty.find((item) => item.key === 'move')?.status, 'Necesita atención', '0 sesiones se expresa sin score');
equal(empty.find((item) => item.key === 'food')?.status, 'Necesita atención', '0 registros se expresa sin score');
equal(empty.find((item) => item.key === 'rest')?.status, 'Sin datos', 'Rest sin plan no inventa descanso');

console.log('✓ Jardín resume datos reales y planes personales sin confundir intención con cumplimiento');
