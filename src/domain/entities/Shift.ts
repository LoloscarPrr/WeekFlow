export type ShiftType = 'morning' | 'afternoon' | 'night' | 'off' | 'custom';

export type Shift = {
  start: string;
  end: string;
  type: ShiftType;
  /** Duración de la colación en minutos. Ausente solo en datos heredados. */
  breakMinutes?: number;
};

export type WeekShift = Shift & {
  day: number;
};

export type WeekSource = 'manual' | 'camera' | 'library' | 'pdf' | 'excel' | 'legacy';

export type ImportantMoment = {
  id: string;
  /** Fecha calendario local YYYY-MM-DD. Es la fuente de verdad del momento. */
  date: string;
  /** Día lunes-domingo derivado de date; se conserva para presentación semanal. */
  day: number;
  time: string;
  title: string;
};

export type WeekSchedule = {
  shifts: WeekShift[];
  importantMoments: ImportantMoment[];
  organizedAt: string | null;
  source: WeekSource;
};
