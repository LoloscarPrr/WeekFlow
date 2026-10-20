import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNowView } from '@/src/application/useCases/getNowView';
import { getRestView } from '@/src/application/useCases/getRestView';
import { buildAssistantRealState } from '@/src/assistant/context';
import { interpretAssistantText } from '@/src/assistant/interpret';
import {
  applyBrainAction,
  receiptHasEffectiveChange,
  undoBrainAction,
  type BrainActionProposal,
  type BrainActionReceipt,
} from '@/src/brain/actions';
import { syncLivePlanReminders } from '@/src/services/notifications';
import {
  loadDayState,
  loadFoodDay,
  loadMoveHistory,
  loadUserProfile,
  loadWeekState,
  moveSessionDoneToday,
  saveDayState,
  saveWeekState,
} from '@/src/state/persistence';

function readAssistantContext(now = new Date()) {
  const profile = loadUserProfile();
  const dayState = loadDayState();
  const weekState = loadWeekState();
  const moveHistory = loadMoveHistory();
  const foodDay = loadFoodDay(now);

  const nowView = getNowView({
    dayState,
    weekState,
    moveDoneToday: moveSessionDoneToday(now),
    now,
  });
  const restView = getRestView(dayState, weekState, now);

  return {
    ...buildAssistantRealState({
      profile,
      dayState,
      moveHistory,
      foodDay,
      nowView,
      restView,
      now,
    }),
    needsExitReview: nowView.needsExitReview,
  };
}

export function useAssistantController() {
  const [context, setContext] = useState(() => readAssistantContext());
  const [pendingProposal, setPendingProposal] = useState<BrainActionProposal | null>(null);
  const [lastReceipt, setLastReceipt] = useState<BrainActionReceipt | null>(null);
  const [assistantMessage, setAssistantMessage] = useState(
    'Puedes contarme un cambio simple de energía o de horario.',
  );

  const refresh = useCallback(() => {
    setContext(readAssistantContext());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const interpret = useCallback((input: string) => {
    const now = new Date();
    const result = interpretAssistantText(input, now);
    if (result.status === 'actual-exit-intent') {
      const dayState = loadDayState();
      const weekState = loadWeekState();
      const view = getNowView({
        dayState,
        weekState,
        moveDoneToday: moveSessionDoneToday(now),
        now,
      });
      if (view.todayShift.type === 'off' || (view.phase !== 'working' && view.phase !== 'after')) {
        setPendingProposal(null);
        setAssistantMessage('No hay una jornada activa para registrar esa salida.');
        return false;
      }
      setPendingProposal({
        id: `assistant-exit-${now.getTime()}`,
        kind: 'record-actual-exit',
        title: 'Registrar salida real',
        explanation: `Salida real a las ${result.time}. Ajustaré el regreso y la recuperación; cualquier reajuste importante necesitará tu confirmación en Ahora.`,
        createdAt: now.toISOString(),
        requiresConfirmation: true,
        payload: {
          time: result.time,
          shiftKey: view.shiftContext.key,
          plannedEnd: view.todayShift.end,
        },
      });
      setAssistantMessage('Confirma tu hora real de salida.');
      return true;
    }
    if (result.status === 'unsupported') {
      setPendingProposal(null);
      setAssistantMessage(result.message);
      return false;
    }
    setPendingProposal(result.proposal);
    setAssistantMessage('Esto es lo que entendí. Revísalo antes de confirmar.');
    return true;
  }, []);

  const cancelProposal = useCallback(() => {
    setPendingProposal(null);
    setAssistantMessage('No cambié nada.');
  }, []);

  const confirmProposal = useCallback(() => {
    if (!pendingProposal) return false;

    const state = {
      dayState: loadDayState(),
      weekState: loadWeekState(),
    };
    const now = new Date();
    const actualExitContext = pendingProposal.kind === 'record-actual-exit'
      ? (() => {
        const view = getNowView({
          dayState: state.dayState,
          weekState: state.weekState,
          moveDoneToday: moveSessionDoneToday(now),
          now,
        });
        return {
          shiftKey: view.shiftContext.key,
          snapshot: view.snapshot,
          currentPlan: view.basePlan,
          phase: view.phase,
        };
      })()
      : undefined;
    const result = applyBrainAction(state, pendingProposal, { confirmed: true, now, actualExitContext });

    if (result.status !== 'applied') {
      setAssistantMessage(result.message);
      return false;
    }

    if (pendingProposal.kind === 'set-energy' || pendingProposal.kind === 'record-actual-exit') {
      saveDayState(result.state.dayState);
    } else {
      saveWeekState(result.state.weekState);
    }

    setPendingProposal(null);
    setLastReceipt(result.receipt && receiptHasEffectiveChange(result.receipt) ? result.receipt : null);
    const nextContext = readAssistantContext();
    setAssistantMessage(pendingProposal.kind === 'record-actual-exit'
      ? nextContext.needsExitReview
        ? 'Salida registrada. Confirma el reajuste en Ahora.'
        : 'Salida real registrada.'
      : result.message);
    setContext(nextContext);

    void syncLivePlanReminders().catch((error) => {
      console.warn('Could not refresh WeekFlow reminders after Assistant action', error);
    });
    return true;
  }, [pendingProposal]);

  const undoLastChange = useCallback(() => {
    if (!lastReceipt) return false;

    const state = {
      dayState: loadDayState(),
      weekState: loadWeekState(),
    };
    const result = undoBrainAction(state, lastReceipt);
    // A stale receipt must never remain actionable after a conflict or successful undo.
    setLastReceipt(null);
    setAssistantMessage(result.message);
    if (result.status !== 'reverted') {
      setContext(readAssistantContext());
      return false;
    }

    if (lastReceipt.before.target === 'day-state') {
      saveDayState(result.state.dayState);
    } else {
      saveWeekState(result.state.weekState);
    }

    setContext(readAssistantContext());
    void syncLivePlanReminders().catch((error) => {
      console.warn('Could not refresh WeekFlow reminders after Assistant undo', error);
    });
    return true;
  }, [lastReceipt]);

  return {
    context,
    refresh,
    pendingProposal,
    lastReceipt,
    undoLastChange,
    assistantMessage,
    interpret,
    confirmProposal,
    cancelProposal,
  };
}
