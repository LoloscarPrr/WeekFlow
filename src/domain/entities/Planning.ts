import type { DaySettings, Energy } from './DailyState';
import type { Shift } from './Shift';

export type BrainSnapshot = DaySettings & {
  energy: Energy;
  shift: Shift;
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
