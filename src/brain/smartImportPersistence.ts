import { prepareSmartImport, applySmartImport, undoSmartImport, type SmartImportReceipt, type SmartImportSource } from './smartImport';
import type { ReviewShift } from '../import/scheduleOcr';
import type { WeekSchedule } from '../domain/entities/Shift';
import { loadUserProfile, loadWeekState, saveUserProfile, saveWeekState } from '../state/persistence';
import { syncLivePlanReminders } from '../services/notifications';

export type ConfirmedImportReceipt = {
  week: SmartImportReceipt;
  previousName: string;
  importedName: string;
};

function refreshReminders() {
  void syncLivePlanReminders().catch((error) => {
    console.warn('Could not refresh WeekFlow reminders after Smart Import', error);
  });
}

export function confirmReviewedImport(input: {
  baseline: WeekSchedule;
  shifts: ReviewShift[];
  source: SmartImportSource;
  matchedName: string | null;
  configuredName: string;
}): { status: 'applied'; receipt: ConfirmedImportReceipt }
  | { status: 'review-required' | 'conflict'; message: string } {
  const prepared = prepareSmartImport(input.baseline, input.shifts, input.source, input.matchedName);
  if (prepared.status !== 'ready') {
    return { status: 'review-required', message: prepared.problems.join('\n') };
  }
  const committed = applySmartImport(loadWeekState(), prepared.proposal, true);
  if (committed.status !== 'applied') {
    return { status: 'conflict', message: committed.status === 'conflict' ? committed.message : 'Confirma primero.' };
  }
  const profile = loadUserProfile();
  const importedName = input.configuredName.trim();
  saveWeekState(committed.week);
  saveUserProfile({ ...profile, scheduleName: importedName });
  refreshReminders();
  return {
    status: 'applied',
    receipt: {
      week: committed.receipt,
      previousName: profile.scheduleName,
      importedName,
    },
  };
}

export function undoReviewedImport(receipt: ConfirmedImportReceipt):
  { status: 'reverted' } | { status: 'conflict'; message: string } {
  const result = undoSmartImport(loadWeekState(), receipt.week);
  if (result.status === 'conflict') return result;
  saveWeekState(result.week);
  const profile = loadUserProfile();
  if (profile.scheduleName === receipt.importedName) {
    saveUserProfile({ ...profile, scheduleName: receipt.previousName });
  }
  refreshReminders();
  return { status: 'reverted' };
}
