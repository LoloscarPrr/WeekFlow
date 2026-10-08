import { buildAssistantRealState } from '../src/assistant/context';
import { defaultDayState, defaultUserProfile, defaultWeekState } from '../src/domain/defaults';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const now = new Date(2026, 9, 8, 10, 0, 0, 0);
const base = buildAssistantRealState({
  profile: defaultUserProfile,
  dayState: defaultDayState,
  moveHistory: [],
  foodDay: { date: '2026-10-08', entries: [] },
  nowView: {
    live: { title: 'Día despejado', blue: 'Sin pendientes inmediatos' },
    jornadaLabel: 'Libre',
    phase: 'off',
  },
  restView: {
    contextTitle: 'Día abierto',
    contextMeta: 'Sin presión por completar una rutina.',
  },
  nowView: {
    live: { title: 'Día despejado', blue: 'Sin pendientes inmediatos' },
    jornadaLabel: 'Libre',
    phase: 'off',
  },
  restView: {
    contextTitle: 'Día abierto',
    contextMeta: 'Sin presión por completar una rutina.',
  },
  now,
});

equal(base.energy, 'bien', 'energía viene de DayState');
equal(base.energyLabel, 'Bien', 'energía se presenta');
equal(base.jornadaLabel, 'Libre', 'día libre viene de Ahora');
equal(base.move.doneToday, false, 'Move vacío no aparece hecho');
equal(base.food.countToday, 0, 'Food vacío cuenta cero');
equal(base.food.lastTitle, null, 'Food vacío no inventa último registro');
ok(base.rest.title.length > 0, 'Rest debe aportar contexto');
equal(base.name, null, 'perfil sin nombre sigue opcional');

const moveAt = new Date(now);
moveAt.setHours(8, 30, 0, 0);
const foodAt1 = new Date(now);
foodAt1.setHours(9, 0, 0, 0);
const foodAt2 = new Date(now);
foodAt2.setHours(9, 30, 0, 0);

const enriched = buildAssistantRealState({
  profile: { name: 'Oscar', scheduleName: '' },
  dayState: { ...defaultDayState, energy: 'cansado' },
  moveHistory: [{ finishedAt: moveAt.toISOString() }],
  foodDay: {
    date: '2026-10-08',
    entries: [
      { id: '1', at: foodAt2.toISOString(), title: 'Yogur', kind: 'snack', source: 'manual' },
      { id: '2', at: foodAt1.toISOString(), title: 'Desayuno', kind: 'meal', source: 'manual' },
    ],
  },
  now,
});

equal(enriched.name, 'Oscar', 'nombre viene del perfil real');
equal(enriched.energyLabel, 'Cansado', 'energía actualizada se refleja');
equal(enriched.move.doneToday, true, 'Move terminado hoy se detecta');
equal(enriched.move.label, 'Hecho hoy', 'Move se resume');
equal(enriched.food.countToday, 2, 'Food cuenta registros reales');
equal(enriched.food.lastTitle, 'Yogur', 'Food usa el último registro cronológico');
ok(enriched.generatedAt === now.toISOString(), 'contexto declara cuándo se generó');

console.log('Assistant real-state context regression tests passed.');
