// Transitional compatibility facade.
// New code should import domain entities directly from src/domain.
export type { Energy } from '@/src/domain/entities/DailyState';
export type { Shift, ShiftType } from '@/src/domain/entities/Shift';
export type {
  BrainMoment,
  BrainMomentType,
  BrainPlan,
  BrainSnapshot,
} from '@/src/domain/entities/Planning';
