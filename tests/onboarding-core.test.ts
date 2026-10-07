import {
  cleanOnboardingName,
  completedOnboardingState,
  hasMeaningfulPriorUse,
  sanitizeOnboardingState,
  type PriorUseSnapshot,
} from '../src/onboarding/core';
import type { WeekSchedule } from '../src/domain/entities/Shift';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const emptyWeek: WeekSchedule = {
  shifts: Array.from({ length: 7 }, (_, day) => ({
    day,
    start: '',
    end: '',
    type: 'off' as const,
    breakMinutes: 0,
  })),
  importantMoments: [],
  organizedAt: null,
  source: 'manual',
};

function snapshot(overrides: Partial<PriorUseSnapshot> = {}): PriorUseSnapshot {
  return {
    profile: { name: '', scheduleName: '' },
    week: emptyWeek,
    moveHistoryCount: 0,
    foodHistoryCount: 0,
    habitCount: 0,
    ...overrides,
  };
}

equal(hasMeaningfulPriorUse(snapshot()), false, 'instalación nueva no parece uso previo');
equal(hasMeaningfulPriorUse(snapshot({ profile: { name: 'Oscar', scheduleName: '' } })), true, 'nombre existente indica uso previo');
equal(hasMeaningfulPriorUse(snapshot({ moveHistoryCount: 1 })), true, 'historial Move indica uso previo');
equal(hasMeaningfulPriorUse(snapshot({ foodHistoryCount: 1 })), true, 'historial Food indica uso previo');
equal(hasMeaningfulPriorUse(snapshot({ habitCount: 1 })), true, 'hábitos indican uso previo');

const workingWeek: WeekSchedule = {
  ...emptyWeek,
  shifts: emptyWeek.shifts.map((shift, index) => index === 0
    ? { ...shift, start: '09:00', end: '18:00', type: 'morning' as const }
    : shift),
};
equal(hasMeaningfulPriorUse(snapshot({ week: workingWeek })), true, 'semana laboral indica uso previo');

equal(cleanOnboardingName('   Oscar   Ignacio  '), 'Oscar Ignacio', 'nombre normaliza espacios');
equal(cleanOnboardingName('   '), '', 'nombre vacío sigue siendo opcional');

const complete = completedOnboardingState('fresh', 'week', new Date('2026-10-07T12:00:00.000Z'));
equal(complete.completed, true, 'estado completado queda marcado');
equal(complete.nextStep, 'week', 'estado conserva siguiente paso');
equal(complete.completedAt, '2026-10-07T12:00:00.000Z', 'estado registra fecha');

const sanitized = sanitizeOnboardingState({
  completed: true,
  completedAt: '2026-10-07T12:00:00.000Z',
  source: 'legacy',
  nextStep: 'later',
});
ok(sanitized, 'estado válido se conserva');
equal(sanitized?.source, 'legacy', 'migración legacy se conserva');
equal(sanitizeOnboardingState({ completed: 'yes' }), null, 'estado inválido se rechaza');

console.log('Onboarding core regression tests passed.');
