import { updateNowEnergy } from '../application/useCases/updateNowState';
import { correctActualExitTime } from '../application/useCases/registerActualExit';
import type { BrainPlan, BrainSnapshot } from '../domain/entities/Planning';
import {
  updateWeekShift,
  type WeekShiftPatch,
} from '../application/useCases/updateWeekSchedule';
import type { DayState, Energy } from '../domain/entities/DailyState';
import type { WeekSchedule } from '../domain/entities/Shift';
import type { FoodDayRecord, FoodEntry } from '../food/history';
import { localDateKey } from '../domain/services/shiftSchedule';

export type BrainActionKind = 'set-energy' | 'update-week-shift' | 'record-actual-exit' | 'log-food-entry';
export type BrainActionStatus =
  | 'applied'
  | 'confirmation-required'
  | 'conflict'
  | 'reverted';

export type BrainActionState = {
  dayState: DayState;
  weekState: WeekSchedule;
  foodDay?: FoodDayRecord;
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

export type RecordActualExitProposal = ProposalBase & {
  kind: 'record-actual-exit';
  payload: {
    time: string;
    shiftKey: string;
    plannedEnd: string;
  };
};

export type LogFoodEntryProposal = ProposalBase & {
  kind: 'log-food-entry';
  payload: { title: string; date: string };
};

export type BrainActionProposal =
  | SetEnergyProposal
  | UpdateWeekShiftProposal
  | RecordActualExitProposal
  | LogFoodEntryProposal;

export type ActualExitActionContext = {
  shiftKey: string;
  shiftStartAt: string | null;
  snapshot: BrainSnapshot;
  currentPlan: BrainPlan;
  phase: 'working' | 'after' | 'before' | 'commuting' | 'off';
};

type BrainActionOptions = {
  confirmed?: boolean;
  now?: Date;
  actualExitContext?: ActualExitActionContext;
};

export type BrainActionTargetSnapshot =
  | { target: 'day-state'; value: DayState }
  | { target: 'week-state'; value: WeekSchedule }
  | { target: 'food-day'; value: FoodDayRecord };

export type BrainActionReceipt = {
  proposalId: string;
  kind: BrainActionKind;
  appliedAt: string;
  before: BrainActionTargetSnapshot;
  after: BrainActionTargetSnapshot;
};

export function receiptHasEffectiveChange(receipt: BrainActionReceipt): boolean {
  return JSON.stringify(receipt.before.value) !== JSON.stringify(receipt.after.value);
}

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
  if (proposal.kind === 'record-actual-exit' && (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(proposal.payload.time)
    || !proposal.payload.shiftKey.trim()
    || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(proposal.payload.plannedEnd)
  )) {
    throw new Error('Invalid actual exit proposal');
  }

  if (proposal.kind === 'log-food-entry' && (
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(proposal.payload.date)
    || !proposal.payload.title.trim()
    || proposal.payload.title.trim().length > 120
  )) {
    throw new Error('Invalid Food entry proposal');
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
  if (proposal.kind === 'set-energy' || proposal.kind === 'record-actual-exit') {
    return { target: 'day-state', value: state.dayState };
  }
  if (proposal.kind === 'log-food-entry') {
    return { target: 'food-day', value: state.foodDay! };
  }
  return { target: 'week-state', value: state.weekState };
}

function targetAfter(
  state: BrainActionState,
  proposal: BrainActionProposal,
): BrainActionTargetSnapshot {
  if (proposal.kind === 'set-energy' || proposal.kind === 'record-actual-exit') {
    return { target: 'day-state', value: state.dayState };
  }
  if (proposal.kind === 'log-food-entry') {
    return { target: 'food-day', value: state.foodDay! };
  }
  return { target: 'week-state', value: state.weekState };
}

function applyProposal(
  state: BrainActionState,
  proposal: BrainActionProposal,
  options: BrainActionOptions,
): BrainActionState {
  if (proposal.kind === 'set-energy') {
    return {
      ...state,
      dayState: updateNowEnergy(state.dayState, proposal.payload.energy),
    };
  }

  if (proposal.kind === 'log-food-entry') {
    const now = options.now ?? new Date();
    const record: FoodEntry = {
      id: proposal.id,
      at: now.toISOString(),
      title: proposal.payload.title.trim(),
      kind: 'other',
      source: 'manual',
    };
    return {
      ...state,
      foodDay: {
        date: state.foodDay!.date,
        entries: [...state.foodDay!.entries.filter((entry) => entry.id !== record.id), record]
          .sort((a, b) => a.at.localeCompare(b.at)),
      },
    };
  }

  if (proposal.kind === 'record-actual-exit') {
    const context = options.actualExitContext;
    if (!context) throw new Error('Actual exit context is required');
    const result = correctActualExitTime({
      state: state.dayState,
      shiftKey: context.shiftKey,
      snapshot: context.snapshot,
      currentPlan: context.currentPlan,
      time: proposal.payload.time,
      referenceAt: options.now,
    });
    return { ...state, dayState: result.state };
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
  options: BrainActionOptions = {},
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

  if (proposal.kind === 'record-actual-exit') {
    const context = options.actualExitContext;
    if (!context || context.shiftKey !== proposal.payload.shiftKey
      || context.snapshot.shift.end !== proposal.payload.plannedEnd
      || context.snapshot.shift.type === 'off'
      || (context.phase !== 'working' && context.phase !== 'after')) {
      return {
        status: 'conflict',
        state,
        receipt: null,
        message: 'La jornada cambió o no está activa. No registré la salida.',
      };
    }
  }
  if (proposal.kind === 'record-actual-exit') {
    const context = options.actualExitContext!;
    const clockNow = options.now ?? new Date();
    const potentialExit = correctActualExitTime({
      state: state.dayState,
      shiftKey: context.shiftKey,
      snapshot: context.snapshot,
      currentPlan: context.currentPlan,
      time: proposal.payload.time,
      referenceAt: clockNow,
    });
    const shiftStarts = context.shiftStartAt ? new Date(context.shiftStartAt) : null;
    if (!shiftStarts || !Number.isFinite(shiftStarts.getTime())
      || potentialExit.recordedAt < shiftStarts || potentialExit.recordedAt > clockNow) {
      return {
        status: 'conflict',
        state,
        receipt: null,
        message: 'La hora indicada no corresponde a una salida ya ocurrida en esta jornada.',
      };
    }
  }

  if (proposal.kind === 'log-food-entry') {
    const now = options.now ?? new Date();
    if (!state.foodDay
      || state.foodDay.date !== proposal.payload.date
      || localDateKey(now) !== proposal.payload.date
      || state.foodDay.entries.some((entry) => entry.id === proposal.id)) {
      return {
        status: 'conflict',
        state,
        receipt: null,
        message: 'El día cambió o el registro ya existe. No agregué comida.',
      };
    }
  }

  const before = targetBefore(state, proposal);
  const next = applyProposal(state, proposal, options);
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
  if (receipt.after.target === 'food-day') {
    return state.foodDay
      ? { target: 'food-day', value: state.foodDay }
      : { target: 'food-day', value: { date: '', entries: [] } };
  }
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
    : receipt.before.target === 'food-day'
      ? { ...state, foodDay: receipt.before.value }
      : { ...state, weekState: receipt.before.value };

  return {
    status: 'reverted',
    state: reverted,
    receipt: null,
    message: 'Cambio deshecho.',
  };
}
