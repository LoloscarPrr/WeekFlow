export type Energy = 'vigoroso' | 'bien' | 'cansado' | 'agotado';

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'off' | 'custom';

export type Shift = {
  start: string;
  end: string;
  type: ShiftType;
};

export type BrainSnapshot = {
  energy: Energy;
  shift: Shift;
  commuteOutMin: number;
  commuteBackMin: number;
  prepMin: number;
  bufferMin: number;
  mealMin: number;
  recoveryMin: number;
};

export type BrainMomentType =
  | 'wake'
  | 'food'
  | 'prep'
  | 'commute-out'
  | 'work'
  | 'commute-back'
  | 'recovery'
  | 'rest'
  | 'move'
  | 'personal';

export type BrainMoment = {
  time: string;
  icon: string;
  title: string;
  detail: string;
  type: BrainMomentType;
  flexible: boolean;
};

export type BrainPlan = {
  mode: 'workday' | 'night-shift' | 'day-off';
  headline: string;
  summary: string;
  primary: BrainMoment;
  moments: BrainMoment[];
};

// v4.8.1: native Brain contract + real planning output.
