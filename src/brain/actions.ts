import { updateNowEnergy } from '../application/useCases/updateNowState';
import {
  updateWeekShift,
  type WeekShiftPatch,
} from '../application/useCases/updateWeekSchedule';
import type { DayState, Energy } from '../domain/entities/DailyState';
import type { WeekSchedule } from '../domain/entities/Shift';

export type BrainActionKind = 'set-energy' | 'update-week-shift';
export type BrainActionStatus =
  | 'applied'
  | 'confirmation-required'
  | 'conflict'
  | 'reverted';

export type BrainActionState = {
  dayState: DayState;
  weekState: WeekSchedule;
};

type ProposalBase = {
  id: string;
  title: string;
  explanation: string;
  createdAt: string;
  requiresConfirmation: boolean;
};

export type SetEnergyProposal = ProposalBase & {
  kind: 'set-energy';
  payload: { energy: Energy };
};

export type UpdateWeekShiftProposal = ProposalBase & {
  kind: 'update-week-shift';
  payload: {
    day: number;
    patch: WeekShiftPatch;
  };
};

export type BrainActionProposal =
  | SetEnergyProposal
  | UpdateWeekShiftProposal;

export type BrainActionTargetSnapshot =
  | { target: 'day-state'; value: DayState }
  | { target: 'week-state'; value: WeekSchedule };

export type BrainActionReceipt = {
  proposalId: string;
  kind: BrainActionKind;
  appliedAt: string;
  before: BrainActionTargetSnapshot;
  after: BrainActionTargetSnapshot;
};

export type BrainActionResult = {
  status: BrainActionStatus;
  state: BrainActionState;
  receipt: BrainActionReceipt | null;
  message: string;
};

function cleanText(value: string, max: number) {
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function validIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function validId(value: string) {
  return /^[a-zA-Z0-9._:-]{1,120}$/.test(value);
}

function validDay(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function createBrainActionProposal(
  proposal: BrainActionProposal,
): BrainActionProposal {
  const id = cleanText(proposal.id, 120);
  const title = cleanText(proposal.title, 100);
  const explanation = cleanText(proposal.explanation, 320);
  if (!validId(id)) throw new Error('Invalid Brain action id');
  if (!title) throw new Error('Brain action title is required');
  if (!explanation) throw new Error('Brain action explanation is required');
  if (!validIsoDate(proposal.createdAt)) throw new Error('Invalid Brain action createdAt');

  if (proposal.kind === 'update-week-shift' && !validDay(proposal.payload.day)) {
    throw new Error('Invalid week day');
  }

  return {
    ...proposal,
    id,
    title,
    explanation,
  };
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function targetBefore(
  state: BrainActionState,
  proposal: BrainActionProposal,
): BrainActionTargetSnapshot {
  if (proposal.kind === 'set-energy') {
    return { target: 'day-state', value: state.dayState };
  }
  return { target: 'week-state', value: state.weekState };
}

function targetAfter(
  state: BrainActionState,
  proposal: BrainActionProposal,
): BrainActionTargetSnapshot {
  if (proposal.kind === 'set-energy') {
    return { target: 'day-state', value: state.dayState };
  }
  return { target: 'week-state', value: state.weekState };
}

function applyProposal(
  state: BrainActionState,
  proposal: BrainActionProposal,
): BrainActionState {
  if (proposal.kind === 'set-energy') {
    return {
      ...state,
      dayState: updateNowEnergy(state.dayState, proposal.payload.energy),
    };
  }

  return {
    ...state,
    weekState: updateWeekShift(
      state.weekState,
      proposal.payload.day,
      proposal.payload.patch,
    ),
  };
}

export function applyBrainAction(
  state: BrainActionState,
  rawProposal: BrainActionProposal,
  options: { confirmed?: boolean; now?: Date } = {},
): BrainActionResult {
  const proposal = createBrainActionProposal(rawProposal);

  if (proposal.requiresConfirmation && options.confirmed !== true) {
    return {
      status: 'confirmation-required',
      state,
      receipt: null,
      message: 'Este cambio necesita tu confirmación antes de aplicarse.',
    };
  }

  const before = targetBefore(state, proposal);
  const next = applyProposal(state, proposal);
  const after = targetAfter(next, proposal);
  const appliedAt = (options.now ?? new Date()).toISOString();

  return {
    status: 'applied',
    state: next,
    receipt: {
      proposalId: proposal.id,
      kind: proposal.kind,
      appliedAt,
      before,
      after,
    },
    message: sameValue(before.value, after.value)
      ? 'El estado ya estaba como proponía WeekFlow.'
      : 'Cambio aplicado.',
  };
}

function currentTarget(
  state: BrainActionState,
  receipt: BrainActionReceipt,
): BrainActionTargetSnapshot {
  return receipt.after.target === 'day-state'
    ? { target: 'day-state', value: state.dayState }
    : { target: 'week-state', value: state.weekState };
}

export function undoBrainAction(
  state: BrainActionState,
  receipt: BrainActionReceipt,
): BrainActionResult {
  const current = currentTarget(state, receipt);

  if (
    current.target !== receipt.after.target
    || !sameValue(current.value, receipt.after.value)
  ) {
    return {
      status: 'conflict',
      state,
      receipt: null,
      message: 'No deshice el cambio porque ese estado cambió después.',
    };
  }

  const reverted: BrainActionState = receipt.before.target === 'day-state'
    ? { ...state, dayState: receipt.before.value }
    : { ...state, weekState: receipt.before.value };

  return {
    status: 'reverted',
    state: reverted,
    receipt: null,
    message: 'Cambio deshecho.',
  };
}
