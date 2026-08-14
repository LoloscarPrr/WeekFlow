import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getRestView } from '@/src/application/useCases/getRestView';
import { loadDayState, loadWeekState } from '@/src/state/persistence';

export function useRestController() {
  const [dayState, setDayState] = useState(() => loadDayState());
  const [weekState, setWeekState] = useState(() => loadWeekState());
  const [now, setNow] = useState(() => new Date());

  const refreshRest = useCallback(() => {
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setNow(new Date());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRest();
    }, [refreshRest]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const view = useMemo(
    () => getRestView(dayState, weekState, now),
    [dayState, now, weekState],
  );

  return {
    view,
    refreshRest,
  };
}
