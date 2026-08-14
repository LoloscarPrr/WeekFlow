import type { DayState, Energy } from '@/src/domain/entities/DailyState';

export function updateNowEnergy(state: DayState, energy: Energy): DayState {
  return { ...state, energy };
}

export function confirmNowExitReplan(state: DayState): DayState {
  return { ...state, actualExitReplanConfirmed: true };
}

export function undoNowActualExit(state: DayState): DayState {
  return {
    ...state,
    actualExit: null,
    actualExitAt: null,
    actualExitShiftKey: null,
    actualExitReplanConfirmed: false,
  };
}
