import type { Shift } from '../entities/Shift';

export function shiftSummaryLabel(shift: Shift) {
  if (shift.type === 'off') return 'Libre';

  const schedule = `${shift.start}–${shift.end}`;
  const breakMinutes = Math.max(0, Math.round(shift.breakMinutes ?? 0));
  return breakMinutes > 0
    ? `${schedule} · colación ${breakMinutes} min`
    : schedule;
}
