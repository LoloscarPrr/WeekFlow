import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { buildAssistantRealState } from '@/src/assistant/context';
import {
  loadDayState,
  loadFoodDay,
  loadMoveHistory,
  loadUserProfile,
  loadWeekState,
} from '@/src/state/persistence';

function readAssistantContext(now = new Date()) {
  return buildAssistantRealState({
    profile: loadUserProfile(),
    dayState: loadDayState(),
    weekState: loadWeekState(),
    moveHistory: loadMoveHistory(),
    foodDay: loadFoodDay(now),
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
