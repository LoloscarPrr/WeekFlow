import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { recordDailyEnergy } from '@/src/brain/energyHistory';
import { getNowView, loadNowPlanningState } from '@/src/application/useCases/getNowView';
import { moveDoneFromHistoryOnDate } from '@/src/domain/services/nowMoveCompletion';
import { mondayKey } from '@/src/domain/services/weekWindow';
import {
  correctActualExitTime as correctActualExitTimeUseCase,
  registerActualExit,
} from '@/src/application/useCases/registerActualExit';
import {
  confirmNowExitReplan,
  updateNowEnergy,
} from '@/src/application/useCases/updateNowState';
import type { Energy } from '@/src/domain/entities/DailyState';
import { syncLivePlanReminders } from '@/src/services/notifications';
import {
  loadDayState,
  loadWeekState,
  loadPreviousWeekState,
  saveDayState,
} from '@/src/state/persistence';

export function useNowController() {
  const [dayState, setDayState] = useState(() => loadDayState());
  const [weekState, setWeekState] = useState(() => loadWeekState());
  const [previousWeekState, setPreviousWeekState] = useState(() => loadPreviousWeekState());
  const [loadedMonday, setLoadedMonday] = useState(() => mondayKey(new Date()));
  const [clockNow, setClockNow] = useState(() => new Date());
  const [planningState, setPlanningState] = useState(loadNowPlanningState);

  const refreshNow = useCallback(() => {
    const now = new Date();
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setPreviousWeekState(loadPreviousWeekState());
    setLoadedMonday(mondayKey(now));
    setClockNow(now);
    setPlanningState(loadNowPlanningState());
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

  // Keep Ahora correct if it stays open as Monday begins.
  useEffect(() => {
    if (mondayKey(clockNow) !== loadedMonday) {
      setWeekState(loadWeekState());
      setPreviousWeekState(loadPreviousWeekState());
      setLoadedMonday(mondayKey(clockNow));
    }
  }, [clockNow, loadedMonday]);

  useEffect(() => {
    saveDayState(dayState);
    void syncLivePlanReminders().catch((error) => {
      console.warn('Could not refresh WeekFlow reminders after day-state change', error);
    });
  }, [dayState]);

  const view = useMemo(
    () => getNowView({
      dayState,
      weekState,
      previousWeekState,
      moveDoneToday: moveDoneFromHistoryOnDate(planningState.moveHistory, clockNow),
      now: clockNow,
      planningState,
    }),
    [clockNow, dayState, planningState, previousWeekState, weekState],
  );

  const updateEnergy = useCallback((energy: Energy) => {
    recordDailyEnergy(energy);
    setDayState((current) => updateNowEnergy(current, energy));
  }, []);

  const markActualExit = useCallback(() => {
    const result = registerActualExit({
      state: dayState,
      shiftKey: view.shiftContext.key,
      shiftEndAt: view.shiftContext.endAt,
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
      shiftEndAt: view.shiftContext.endAt,
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
