import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNowView } from '@/src/application/useCases/getNowView';
import { getRestView } from '@/src/application/useCases/getRestView';
import { buildAssistantRealState } from '@/src/assistant/context';
import { interpretAssistantText } from '@/src/assistant/interpret';
import {
  applyBrainAction,
  type BrainActionProposal,
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

  return buildAssistantRealState({
    profile,
    dayState,
    moveHistory,
    foodDay,
    nowView,
    restView,
    now,
  });
}

export function useAssistantController() {
  const [context, setContext] = useState(() => readAssistantContext());
  const [pendingProposal, setPendingProposal] = useState<BrainActionProposal | null>(null);
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
    const result = interpretAssistantText(input);
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
    const result = applyBrainAction(state, pendingProposal, { confirmed: true });

    if (result.status !== 'applied') {
      setAssistantMessage(result.message);
      return false;
    }

    if (pendingProposal.kind === 'set-energy') {
      saveDayState(result.state.dayState);
    } else {
      saveWeekState(result.state.weekState);
    }

    setPendingProposal(null);
    setAssistantMessage(result.message);
    setContext(readAssistantContext());

    void syncLivePlanReminders().catch((error) => {
      console.warn('Could not refresh WeekFlow reminders after Assistant action', error);
    });
    return true;
  }, [pendingProposal]);

  return {
    context,
    refresh,
    pendingProposal,
    assistantMessage,
    interpret,
    confirmProposal,
    cancelProposal,
  };
}
