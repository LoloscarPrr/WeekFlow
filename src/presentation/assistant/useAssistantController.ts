import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNowView } from '@/src/application/useCases/getNowView';
import { getRestView } from '@/src/application/useCases/getRestView';
import { buildAssistantRealState } from '@/src/assistant/context';
import {
  loadDayState,
  loadFoodDay,
  loadMoveHistory,
  loadUserProfile,
  loadWeekState,
  moveSessionDoneToday,
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

  const refresh = useCallback(() => {
    setContext(readAssistantContext());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { context, refresh };
}
