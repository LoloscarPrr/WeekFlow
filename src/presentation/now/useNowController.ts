import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getNowView } from '@/src/application/useCases/getNowView';
import {
  correctActualExitTime as correctActualExitTimeUseCase,
  registerActualExit,
} from '@/src/application/useCases/registerActualExit';
import {
  confirmNowExitReplan,
  updateNowEnergy,
} from '@/src/application/useCases/updateNowState';
import type { Energy } from '@/src/domain/entities/DailyState';
import {
  loadDayState,
  loadWeekState,
  moveSessionDoneToday,
  saveDayState,
} from '@/src/state/persistence';

export function useNowController() {
  const [dayState, setDayState] = useState(() => loadDayState());
  const [weekState, setWeekState] = useState(() => loadWeekState());
  const [clockNow, setClockNow] = useState(() => new Date());
  const [moveDoneToday, setMoveDoneToday] = useState(() => moveSessionDoneToday());

  const refreshNow = useCallback(() => {
    const now = new Date();
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setClockNow(now);
    setMoveDoneToday(moveSessionDoneToday(now));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNow();
    }, [refreshNow]),
  );

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    saveDayState(dayState);
  }, [dayState]);

  const view = useMemo(
    () => getNowView({ dayState, weekState, moveDoneToday, now: clockNow }),
    [clockNow, dayState, moveDoneToday, weekState],
  );

  const updateEnergy = useCallback((energy: Energy) => {
    setDayState((current) => updateNowEnergy(current, energy));
  }, []);

  const markActualExit = useCallback(() => {
    const result = registerActualExit({
      state: dayState,
      shiftKey: view.shiftContext.key,
      snapshot: view.snapshot,
      currentPlan: view.basePlan,
    });
    setClockNow(result.recordedAt);
    setDayState(result.state);
  }, [dayState, view.basePlan, view.shiftContext.key, view.snapshot]);

  const confirmExitReplan = useCallback(() => {
    setDayState((current) => confirmNowExitReplan(current));
  }, []);

  const correctActualExitTime = useCallback((time: string) => {
    const result = correctActualExitTimeUseCase({
      state: dayState,
      shiftKey: view.shiftContext.key,
      snapshot: view.snapshot,
      currentPlan: view.basePlan,
      time,
    });
    setDayState(result.state);
  }, [dayState, view.basePlan, view.shiftContext.key, view.snapshot]);

  return {
    dayState,
    refreshNow,
    updateEnergy,
    markActualExit,
    confirmExitReplan,
    correctActualExitTime,
    ...view,
  };
}
