export type ShiftType = 'morning' | 'afternoon' | 'night' | 'off' | 'custom';

export type Shift = {
  start: string;
  end: string;
  type: ShiftType;
};

export type WeekShift = Shift & {
  day: number;
};

export type WeekSchedule = {
  shifts: WeekShift[];
};
