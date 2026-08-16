import { correctActualExitTime, registerActualExit } from '../src/application/useCases/registerActualExit';
import {
  completeWeekRitual,
  upsertImportantMoment,
  updateWeekShift,
} from '../src/application/useCases/updateWeekSchedule';
import { buildBrainPlan, replanAfterActualExit } from '../src/brain/engine';
import { pendingDatabaseMigrations } from '../src/data/migrations/databaseSchema';
import { migrateDayState, migrateUserProfile, migrateWeekSchedule } from '../src/data/migrations/stateMigrations';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { BrainSnapshot } from '../src/domain/entities/Planning';
import type { WeekSchedule } from '../src/domain/entities/Shift';
import { importantMomentsForDate } from '../src/domain/services/importantMoments';
import { shiftContextForDate, shiftDurationMinutes } from '../src/domain/services/shiftSchedule';
import { correctFoodEntryTime, type FoodEntry } from '../src/food/history';
import { parseScheduleOcr, type OcrElement, type OcrTextResult } from '../src/import/scheduleOcr';

let passed = 0;
let failed = 0;

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function run(name: string, assertion: () => void) {
  try {
    assertion();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

function weekWithMondayNight(): WeekSchedule {
  return {
    ...defaultWeekState,
    shifts: defaultWeekState.shifts.map((shift) => shift.day === 0
      ? { day: 0, start: '22:00', end: '06:00', type: 'night' }
      : { ...shift }),
  };
}

function element(text: string, left: number, top: number, width = 70): OcrElement {
  return { text, frame: { left, top, right: left + width, bottom: top + 20 } };
}

function scheduleFixture(): OcrTextResult {
  const headers = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    .map((label, day) => element(label, 100 + day * 100, 10));
  const values = [
    '07:00 00:30 15:00',
    '13:00 00:30 22:00',
    '22:00 00:30 06:00',
    '00:00 00:00 00:00',
    '08:00 00:30 16:00',
    '09:00 00:30 17:00',
    '00:00 00:00 00:00',
  ].map((text, day) => element(text, 100 + day * 100, 100));

  return {
    text: 'OSCAR URRUTIA',
    blocks: [{
      text: 'Horario semanal',
      frame: { left: 0, top: 0, right: 900, bottom: 140 },
      lines: [
        { text: 'Días', frame: { left: 80, top: 10, right: 850, bottom: 30 }, elements: headers },
        {
          text: 'OSCAR URRUTIA',
          frame: { left: 0, top: 100, right: 850, bottom: 120 },
          elements: [element('OSCAR URRUTIA', 0, 100, 90), ...values],
        },
      ],
    }],
  };
}

run('la jornada nocturna conserva ocho horas reales', () => {
  equal(shiftDurationMinutes('22:00', '06:00'), 8 * 60, 'duración nocturna');
});

run('la madrugada pertenece a la jornada nocturna anterior', () => {
  const context = shiftContextForDate(weekWithMondayNight(), new Date(2026, 7, 18, 2, 0));
  equal(context.day, 0, 'día canónico');
  equal(context.overnightCarry, true, 'arrastre nocturno');
  equal(context.shift.start, '22:00', 'entrada conservada');
});

run('el Brain protege recuperación después de una jornada nocturna', () => {
  const snapshot: BrainSnapshot = {
    ...defaultDayState.settings,
    energy: 'cansado',
    shift: { start: '22:00', end: '06:00', type: 'night' },
  };
  const plan = buildBrainPlan(snapshot);
  equal(plan.mode, 'night-shift', 'modo nocturno');
  ok(plan.moments.some((moment) => moment.type === 'rest' && !moment.flexible), 'Rest debe quedar protegido');
});

run('Ya salí pide confirmación solo cuando mueve bloques flexibles', () => {
  const snapshot: BrainSnapshot = {
    ...defaultDayState.settings,
    energy: 'bien',
    shift: { start: '13:00', end: '22:00', type: 'afternoon' },
  };
  const plan = buildBrainPlan(snapshot);
  const result = registerActualExit({
    state: defaultDayState,
    shiftKey: '2026-08-17@13:00',
    snapshot,
    currentPlan: plan,
    now: new Date(2026, 7, 17, 23, 26),
  });
  equal(result.state.actualExit, '23:26', 'hora real');
  equal(result.requiresConfirmation, true, 'confirmación del reajuste');
});

run('corregir una salida de madrugada elige el día calendario más cercano', () => {
  const snapshot: BrainSnapshot = {
    ...defaultDayState.settings,
    energy: 'bien',
    shift: { start: '22:00', end: '06:00', type: 'night' },
  };
  const plan = buildBrainPlan(snapshot);
  const reference = new Date(2026, 7, 18, 3, 15);
  const result = correctActualExitTime({
    state: { ...defaultDayState, actualExit: '03:15', actualExitAt: reference.toISOString() },
    shiftKey: '2026-08-17@22:00',
    snapshot,
    currentPlan: plan,
    time: '23:30',
  });
  equal(result.recordedAt.getDate(), 17, 'día corregido');
  equal(result.recordedAt.getHours(), 23, 'hora corregida');
  equal(result.recordedAt.getMinutes(), 30, 'minutos corregidos');
});

run('el reajuste nocturno mueve regreso y descanso desde la salida real', () => {
  const snapshot: BrainSnapshot = {
    ...defaultDayState.settings,
    energy: 'bien',
    shift: { start: '22:00', end: '06:00', type: 'night' },
  };
  const updated = replanAfterActualExit(snapshot, buildBrainPlan(snapshot), '07:00');
  equal(updated.moments.find((moment) => moment.type === 'commute-back')?.time, '07:00', 'regreso');
  equal(updated.moments.find((moment) => moment.type === 'rest')?.time, '09:15', 'descanso');
});

run('la migración conserva datos antiguos y completa campos nuevos', () => {
  const migrated = migrateDayState({
    energy: 'agotado',
    snapshot: { commuteOutMin: 44, prepMin: 20 },
    actualExit: '23:26',
  });
  equal(migrated.energy, 'agotado', 'energía');
  equal(migrated.settings.commuteOutMin, 44, 'traslado antiguo');
  equal(migrated.settings.prepMin, 20, 'preparación antigua');
  equal(migrated.settings.recoveryMin, defaultDayState.settings.recoveryMin, 'nuevo valor por defecto');
  equal(migrated.actualExit, '23:26', 'salida conservada');
});

run('la migración semanal preserva jornadas y rellena días ausentes', () => {
  const migrated = migrateWeekSchedule({
    shifts: [
      { day: 0, start: '07:00', end: '15:00', type: 'morning', breakMinutes: 45 },
      { day: 2, start: '22:00', end: '06:00' },
    ],
    importantMoments: [
      { id: 'medico', day: 3, time: '10:30', title: 'Médico' },
      { id: 'invalido', day: 9, time: '99:00', title: 'No guardar' },
    ],
  });
  equal(migrated.shifts.length, 7, 'semana completa');
  equal(migrated.shifts[0].start, '07:00', 'lunes conservado');
  equal(migrated.shifts[2].type, 'night', 'tipo nocturno reconstruido');
  equal(migrated.shifts[1].type, 'off', 'día ausente seguro');
  equal(migrated.shifts[0].breakMinutes, 45, 'colación conservada');
  equal(migrated.importantMoments.length, 1, 'momentos válidos conservados');
  equal(migrated.importantMoments[0].title, 'Médico', 'título conservado');
  equal(migrated.source, 'legacy', 'origen heredado explícito');
  equal(migrated.organizedAt, null, 'cierre ausente seguro');
});

run('editar una jornada conserva momentos y reabre el Ritual', () => {
  const organized: WeekSchedule = {
    ...defaultWeekState,
    organizedAt: '2026-08-16T20:00:00.000Z',
    source: 'camera',
    importantMoments: [{ id: 'cumple', day: 4, time: '19:00', title: 'Cumpleaños' }],
  };
  const updated = updateWeekShift(organized, 0, {
    start: '07:00',
    end: '15:00',
    breakMinutes: 30,
  });
  equal(updated.shifts[0].breakMinutes, 30, 'colación manual');
  equal(updated.importantMoments[0].title, 'Cumpleaños', 'momento conservado');
  equal(updated.organizedAt, null, 'Ritual reabierto');
  equal(updated.source, 'manual', 'origen corregido');
});

run('los momentos importantes se validan, ordenan y permiten cerrar la semana', () => {
  const friday = upsertImportantMoment(defaultWeekState, {
    id: 'viernes',
    day: 4,
    time: '20:00',
    title: '  Cena familiar  ',
  });
  const monday = upsertImportantMoment(friday, {
    id: 'lunes',
    day: 0,
    time: '09:00',
    title: 'Médico',
  });
  equal(monday.importantMoments[0].id, 'lunes', 'orden semanal');
  equal(monday.importantMoments[1].title, 'Cena familiar', 'título normalizado');
  const completed = completeWeekRitual(monday, '2026-08-16T21:00:00.000Z');
  equal(completed.organizedAt, '2026-08-16T21:00:00.000Z', 'cierre persistido');
});

run('Ahora recibe únicamente los momentos importantes del día calendario', () => {
  const week: WeekSchedule = {
    ...defaultWeekState,
    importantMoments: [
      { id: 'lunes', day: 0, time: '18:30', title: 'Médico' },
      { id: 'martes', day: 1, time: '10:00', title: 'Trámite' },
    ],
  };
  const monday = importantMomentsForDate(week, new Date(2026, 7, 17, 8, 0));
  equal(monday.length, 1, 'solo lunes');
  equal(monday[0].moment.title, 'Médico', 'momento visible');
  equal(monday[0].at.getHours(), 18, 'hora local conservada');
});

run('la migración de perfil conserva el nombre de planilla', () => {
  equal(migrateUserProfile({ scheduleName: 'OSCAR URRUTIA' }).scheduleName, 'OSCAR URRUTIA', 'nombre');
});

run('la migración SQLite inicial es aditiva e idempotente', () => {
  const initial = pendingDatabaseMigrations(0);
  equal(initial.length, 1, 'migración inicial');
  ok(initial[0].sql.includes('CREATE TABLE IF NOT EXISTS'), 'debe crear sin reemplazar');
  ok(!/\b(DROP|DELETE)\b/i.test(initial[0].sql), 'no debe borrar datos');
  equal(pendingDatabaseMigrations(1).length, 0, 'segunda ejecución');
});

run('corregir una comida conserva el registro y lo reordena por hora', () => {
  const entries: FoodEntry[] = [
    { id: 'almuerzo', at: new Date(2026, 7, 17, 13, 0).toISOString(), title: 'Completo', kind: 'meal', source: 'manual' },
    { id: 'once', at: new Date(2026, 7, 17, 19, 30).toISOString(), title: 'Sándwich + fruta', kind: 'meal', source: 'suggestion' },
  ];
  const corrected = correctFoodEntryTime(entries, 'once', '08:15', '2026-08-17');
  ok(corrected, 'la corrección debe ser válida');
  equal(corrected?.[0].id, 'once', 'orden cronológico');
  equal(corrected?.[0].title, 'Sándwich + fruta', 'alimento conservado');
  equal(new Date(corrected?.[0].at ?? '').getHours(), 8, 'hora corregida');
});

run('el OCR reconoce la fila configurada y separa jornadas', () => {
  const parsed = parseScheduleOcr(scheduleFixture(), 'OSCAR URRUTIA');
  equal(parsed.nameFound, true, 'nombre encontrado');
  equal(parsed.shifts[0].start, '07:00', 'entrada lunes');
  equal(parsed.shifts[1].end, '22:00', 'salida martes');
  equal(parsed.shifts[2].type, 'night', 'miércoles nocturno');
  equal(parsed.shifts[3].off, true, 'jueves libre');
  equal(parsed.shifts[0].breakMinutes, 30, 'colación separada');
});

run('el OCR no inventa horarios cuando falta el nombre', () => {
  const parsed = parseScheduleOcr(scheduleFixture(), 'OTRA PERSONA');
  equal(parsed.nameFound, false, 'nombre ausente');
  equal(parsed.shifts.every((shift) => shift.confidence === 'low'), true, 'días pendientes');
  equal(parsed.shifts.every((shift) => !shift.start && !shift.end), true, 'sin horas inventadas');
});

console.log(`\nRegresiones WeekFlow: ${passed} aprobadas, ${failed} fallidas.`);
if (failed > 0) throw new Error(`${failed} regresiones fallaron.`);
