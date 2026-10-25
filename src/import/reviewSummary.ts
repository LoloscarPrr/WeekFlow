import { validateSmartImportShift } from '../brain/smartImport';
import type { WeekSchedule, WeekShift } from '../domain/entities/Shift';
import type { ReviewShift } from './scheduleOcr';

export type ReviewDayStatus = 'review' | 'changed' | 'unchanged';
export type ReviewDaySummary = {
  day: number;
  status: ReviewDayStatus;
  valid: boolean;
  issue: string | null;
  proposed: string;
  previous: string | null;
};
export type WeekReviewSummary = {
  rows: ReviewDaySummary[];
  reviewCount: number;
  changeCount: number;
  unchangedCount: number;
  valid: boolean;
};

function canonicalOff(shift: ReviewShift | WeekShift): boolean {
  return 'off' in shift ? shift.off === true : shift.type === 'off';
}
function shiftSignature(shift: ReviewShift | WeekShift): string {
  if (canonicalOff(shift)) return 'off';
  return [
    shift.start,
    shift.end,
    shift.breakMinutes === undefined ? 0 : shift.breakMinutes,
  ].join('|');
}
function label(shift: ReviewShift | WeekShift): string {
  if (canonicalOff(shift)) return 'Libre';
  const start = shift.start || '--:--';
  const end = shift.end || '--:--';
  const breakValue = shift.breakMinutes;
  const breakLabel = breakValue === null || breakValue === undefined
    ? 'colación pendiente' : 'colación ' + breakValue + ' min';
  return start + '–' + end + ' · ' + breakLabel;
}

// All review surfaces use the authoritative Smart Import validator.
// Metadata, name spelling and confidence do not masquerade as schedule changes.
export function summarizeWeekReview(
  shifts: ReviewShift[],
  baseline: WeekSchedule | null,
): WeekReviewSummary {
  const seen = new Set<number>();
  const rows: ReviewDaySummary[] = [...shifts]
    .sort((a, b) => a.day - b.day)
    .map((shift) => {
      const repeated = seen.has(shift.day);
      seen.add(shift.day);
      const previous = baseline?.shifts.find((saved) => saved.day === shift.day) ?? null;
      const problem = repeated ? 'Este día está duplicado.'
        : !Number.isInteger(shift.day) || shift.day < 0 || shift.day > 6
          ? 'El día no está dentro de la semana.'
          : validateSmartImportShift(shift);
      const status: ReviewDayStatus = problem ? 'review'
        : !previous || shiftSignature(shift) !== shiftSignature(previous) ? 'changed' : 'unchanged';
      return {
        day: shift.day,
        status,
        valid: problem === null,
        issue: problem,
        proposed: label(shift),
        previous: previous ? label(previous) : null,
      };
    });
  const complete = shifts.length === 7 && seen.size === 7
    && [...seen].every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return {
    rows,
    reviewCount: rows.filter((r) => r.status === 'review').length,
    changeCount: rows.filter((r) => r.status === 'changed').length,
    unchangedCount: rows.filter((r) => r.status === 'unchanged').length,
    valid: complete && rows.every((r) => r.valid),
  };
}
