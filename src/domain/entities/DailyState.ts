export type Energy = 'vigoroso' | 'bien' | 'cansado' | 'agotado';

export type DaySettings = {
  commuteOutMin: number;
  commuteBackMin: number;
  prepMin: number;
  bufferMin: number;
  mealMin: number;
  recoveryMin: number;
};

export type DayState = {
  energy: Energy;
  settings: DaySettings;
  actualExit: string | null;
  actualExitAt: string | null;
  actualExitShiftKey: string | null;
  actualExitReplanConfirmed: boolean;
};
