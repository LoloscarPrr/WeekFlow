import type { WeekSchedule } from '../entities/Shift';

export interface WeekScheduleRepository {
  load(): WeekSchedule;
  save(state: WeekSchedule): void;
}
