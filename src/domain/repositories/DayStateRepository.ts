import type { DayState } from '../entities/DailyState';

export interface DayStateRepository {
  load(): DayState;
  save(state: DayState): void;
}
