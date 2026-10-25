import type { ReviewShift } from '../import/scheduleOcr';
import type { WeekSchedule, WeekSource, WeekShift } from '../domain/entities/Shift';
import { classifyShift } from '../domain/services/shiftSchedule';

export type SmartImportSource = 'library' | 'camera' | 'pdf' | 'excel';

export type SmartImportReceipt = {
  before: WeekSchedule;
  after: WeekSchedule;
};

export type SmartImportProposal = {
  source: SmartImportSource;
  matchedName: string;
  before: WeekSchedule;
  next: WeekSchedule;
};

export type SmartImportPreparation =
  | { status: 'ready'; proposal: SmartImportProposal }
  | { status: 'review-required'; problems: string[] };

export type SmartImportCommit =
  | { status: 'applied'; week: WeekSchedule; receipt: SmartImportReceipt }
  | { status: 'conflict'; message: string };

function validTime(time: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function minutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function validateSmartImportShift(shift: ReviewShift): string | null {
  if (shift.issue) return shift.issue;
  if (shift.confidence === 'low') return 'La lectura todavía es incierta.';
  if (shift.off) {
    if (shift.start || shift.end || shift.breakMinutes !== 0) {
      return 'El día libre tiene horas o colación contradictorias.';
    }
    return null;
  }
  if (!validTime(shift.start) || !validTime(shift.end)) {
    return 'Falta una hora de entrada o salida válida.';
  }
  if (shift.start === shift.end) return 'La entrada y salida no pueden ser iguales.';
  if (shift.breakMinutes === null || !Number.isInteger(shift.breakMinutes)
    || shift.breakMinutes < 0 || shift.breakMinutes > 180) {
    return 'La colación debe ser una duración entre 0 y 180 minutos.';
  }
  const duration = (minutes(shift.end) - minutes(shift.start) + 1440) % 1440;
  if (duration < 180 || duration > 840 || shift.breakMinutes >= duration) {
    return 'La duración de jornada no es coherente.';
  }
  return null;
}

function sameWeek(a: WeekSchedule, b: WeekSchedule) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// The recognizer is a replaceable source of evidence. Only this Brain action
// can create a confirmed canonical WeekSchedule, regardless of file format.
export function prepareSmartImport(
  current: WeekSchedule,
  shifts: ReviewShift[],
  source: SmartImportSource,
  matchedName: string | null,
): SmartImportPreparation {
  const problems: string[] = [];
  if (!matchedName?.trim()) problems.push('No pude comprobar a quién pertenece la fila.');
  if (shifts.length !== 7 || new Set(shifts.map((shift) => shift.day)).size !== 7
    || shifts.some((shift) => !Number.isInteger(shift.day) || shift.day < 0 || shift.day > 6)) {
    problems.push('La propuesta debe contener los siete días, una vez cada uno.');
  }
  const ordered = [...shifts].sort((a, b) => a.day - b.day);
  for (const shift of ordered) {
    const issue = validateSmartImportShift(shift);
    if (issue) problems.push(shift.label + ': ' + issue);
  }
  if (problems.length) return { status: 'review-required', problems };

  const nextShifts: WeekShift[] = ordered.map((shift) => ({
    day: shift.day,
    start: shift.off ? '' : shift.start,
    end: shift.off ? '' : shift.end,
    breakMinutes: shift.off ? 0 : shift.breakMinutes!,
    type: shift.off ? 'off' : classifyShift(shift.start, shift.end),
  }));
  // Copy every fixed commitment as-is, and reopen the week organization ritual.
  const before: WeekSchedule = JSON.parse(JSON.stringify(current));
  return {
    status: 'ready',
    proposal: {
      source,
      matchedName: matchedName!.trim(),
      before,
      next: {
        ...before,
        shifts: nextShifts,
        importantMoments: before.importantMoments,
        organizedAt: null,
        source: source as WeekSource,
      },
    },
  };
}

export function applySmartImport(
  current: WeekSchedule,
  proposal: SmartImportProposal,
  confirmed: boolean,
): SmartImportCommit | { status: 'confirmation-required' } {
  if (!confirmed) return { status: 'confirmation-required' };
  if (!sameWeek(current, proposal.before)) {
    return { status: 'conflict', message: 'Tu Semana cambió desde que leíste el archivo. Vuelve a revisarla antes de guardar.' };
  }
  const after: WeekSchedule = JSON.parse(JSON.stringify(proposal.next));
  return {
    status: 'applied',
    week: after,
    receipt: { before: proposal.before, after },
  };
}

export function undoSmartImport(
  current: WeekSchedule,
  receipt: SmartImportReceipt,
): { status: 'reverted'; week: WeekSchedule } | { status: 'conflict'; message: string } {
  if (!sameWeek(current, receipt.after)) {
    return { status: 'conflict', message: 'No deshice la importación porque Semana cambió después.' };
  }
  return { status: 'reverted', week: JSON.parse(JSON.stringify(receipt.before)) };
}
