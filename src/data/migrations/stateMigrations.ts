import {
  defaultDayState,
  defaultUserProfile,
  defaultWeekState,
} from '../../domain/defaults';
import type { DayState, Energy } from '../../domain/entities/DailyState';
import type { ShiftType, WeekSchedule } from '../../domain/entities/Shift';
import type { UserProfile } from '../../domain/entities/UserProfile';
import { classifyShift } from '../../domain/services/shiftSchedule';

type UnknownRecord = Record<string, unknown>;

const energyValues: Energy[] = ['vigoroso', 'bien', 'cansado', 'agotado'];
const shiftTypes: ShiftType[] = ['morning', 'afternoon', 'night', 'off', 'custom'];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function nullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

export function migrateDayState(value: unknown): DayState {
  if (!isRecord(value)) {
    return {
      ...defaultDayState,
      settings: { ...defaultDayState.settings },
    };
  }

  const settings = isRecord(value.settings) ? value.settings : {};
  const legacySnapshot = isRecord(value.snapshot) ? value.snapshot : {};
  const setting = (key: keyof DayState['settings']) => finiteNumber(
    settings[key] ?? legacySnapshot[key],
    defaultDayState.settings[key],
  );

  return {
    energy: typeof value.energy === 'string' && energyValues.includes(value.energy as Energy)
      ? value.energy as Energy
      : defaultDayState.energy,
    settings: {
      commuteOutMin: setting('commuteOutMin'),
      commuteBackMin: setting('commuteBackMin'),
      prepMin: setting('prepMin'),
      bufferMin: setting('bufferMin'),
      mealMin: setting('mealMin'),
      recoveryMin: setting('recoveryMin'),
    },
    actualExit: nullableString(value.actualExit),
    actualExitAt: nullableString(value.actualExitAt),
    actualExitShiftKey: nullableString(value.actualExitShiftKey),
    actualExitReplanConfirmed: value.actualExitReplanConfirmed === true,
  };
}

export function migrateWeekSchedule(value: unknown): WeekSchedule {
  const parsedShifts = isRecord(value) && Array.isArray(value.shifts)
    ? value.shifts.filter(isRecord)
    : [];

  return {
    shifts: defaultWeekState.shifts.map((fallback) => {
      const incoming = parsedShifts.find((item) => item.day === fallback.day);
      if (!incoming) return { ...fallback };

      const start = typeof incoming.start === 'string' ? incoming.start : fallback.start;
      const end = typeof incoming.end === 'string' ? incoming.end : fallback.end;
      const type = typeof incoming.type === 'string' && shiftTypes.includes(incoming.type as ShiftType)
        ? incoming.type as ShiftType
        : classifyShift(start, end);

      return { day: fallback.day, start, end, type };
    }),
  };
}

export function migrateUserProfile(value: unknown): UserProfile {
  const parsed = isRecord(value) ? value : {};
  return {
    scheduleName: typeof parsed.scheduleName === 'string'
      ? parsed.scheduleName
      : defaultUserProfile.scheduleName,
  };
}
