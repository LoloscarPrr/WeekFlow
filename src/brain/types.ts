export type Energy = 'vigoroso' | 'bien' | 'cansado' | 'agotado';

export type Shift = {
  start: string;
  end: string;
  type: 'morning' | 'afternoon' | 'night' | 'off' | 'custom';
};

export type BrainSnapshot = {
  energy: Energy;
  shift: Shift;
  commuteMin: number;
  prepMin: number;
  bufferMin: number;
};

// v4.8.0 defines the native contract.
// v4.8.1 will move the real WeekFlow Brain here.
