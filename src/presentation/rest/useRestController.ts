import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getRestView } from '@/src/application/useCases/getRestView';
import { mondayKey } from '@/src/domain/services/weekWindow';
import { loadDayState, loadWeekState, loadWeekStateForOffset, loadPreviousWeekState } from '@/src/state/persistence';

export function useRestController() {
  const [dayState, setDayState] = useState(() => loadDayState());
  const [weekState, setWeekState] = useState(() => loadWeekState());
  const [nextWeek, setNextWeek] = useState(() => loadWeekStateForOffset(1));
  const [previousWeek, setPreviousWeek] = useState(() => loadPreviousWeekState());
  const [loadedMonday, setLoadedMonday] = useState(() => mondayKey(new Date()));
  const [now, setNow] = useState(() => new Date());

  const refreshRest = useCallback(() => {
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setNextWeek(loadWeekStateForOffset(1));
    setPreviousWeek(loadPreviousWeekState());
    setLoadedMonday(mondayKey(new Date()));
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

  useEffect(() => {
    if (mondayKey(now) !== loadedMonday) refreshRest();
  }, [now, loadedMonday, refreshRest]);

  const view = useMemo(
    () => getRestView(dayState, weekState, now, nextWeek, previousWeek),
    [dayState, now, weekState, nextWeek, previousWeek],
  );

  return {
    view,
    refreshRest,
  };
}
