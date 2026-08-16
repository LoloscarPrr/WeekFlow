import {
  defaultDayState,
  defaultUserProfile,
  defaultWeekState,
} from '../../domain/defaults';
import type { DayState, Energy } from '../../domain/entities/DailyState';
import type {
  ImportantMoment,
  ShiftType,
  WeekSchedule,
  WeekSource,
} from '../../domain/entities/Shift';
import type { UserProfile } from '../../domain/entities/UserProfile';
import { classifyShift } from '../../domain/services/shiftSchedule';

type UnknownRecord = Record<string, unknown>;

const energyValues: Energy[] = ['vigoroso', 'bien', 'cansado', 'agotado'];
const shiftTypes: ShiftType[] = ['morning', 'afternoon', 'night', 'off', 'custom'];
const weekSources: WeekSource[] = ['manual', 'camera', 'library', 'pdf', 'excel', 'legacy'];

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

function breakMinutes(value: unknown) {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= 180
    ? value
    : 0;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function migrateImportantMoments(value: unknown): ImportantMoment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .flatMap((item) => {
      const title = typeof item.title === 'string' ? item.title.trim().slice(0, 80) : '';
      const day = typeof item.day === 'number' && Number.isInteger(item.day) ? item.day : -1;
      if (!title || day < 0 || day > 6 || !validTime(item.time)) return [];
      const id = typeof item.id === 'string' && item.id.trim()
        ? item.id
        : `legacy-${day}-${item.time}-${title}`;
      return [{ id, day, time: item.time, title }];
    })
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time) || a.title.localeCompare(b.title));
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
  const parsed = isRecord(value) ? value : {};
  const parsedShifts = Array.isArray(parsed.shifts)
    ? parsed.shifts.filter(isRecord)
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

      return {
        day: fallback.day,
        start,
        end,
        type,
        breakMinutes: type === 'off' ? 0 : breakMinutes(incoming.breakMinutes),
      };
    }),
    importantMoments: migrateImportantMoments(parsed.importantMoments),
    organizedAt: nullableString(parsed.organizedAt),
    source: typeof parsed.source === 'string' && weekSources.includes(parsed.source as WeekSource)
      ? parsed.source as WeekSource
      : 'legacy',
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
