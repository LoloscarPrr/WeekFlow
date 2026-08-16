import type { DayState } from './entities/DailyState';
import type { ShiftType, WeekSchedule } from './entities/Shift';
import type { UserProfile } from './entities/UserProfile';

export const defaultDayState: DayState = {
  energy: 'bien',
  settings: {
    commuteOutMin: 75,
    commuteBackMin: 75,
    prepMin: 35,
    bufferMin: 15,
    mealMin: 25,
    recoveryMin: 30,
  },
  actualExit: null,
  actualExitAt: null,
  actualExitShiftKey: null,
  actualExitReplanConfirmed: false,
};

export const defaultWeekState: WeekSchedule = {
  shifts: Array.from({ length: 7 }, (_, day) => ({
    day,
    start: '',
    end: '',
    type: 'off' as ShiftType,
    breakMinutes: 0,
  })),
  importantMoments: [],
  organizedAt: null,
  source: 'manual',
};

export const defaultUserProfile: UserProfile = {
  scheduleName: '',
};
