import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getGardenView } from '@/src/application/useCases/getGardenView';
import {
  loadDayState,
  loadFoodHistory,
  loadMoveHistory,
  loadWeekState,
} from '@/src/state/persistence';

export function useGardenController() {
  const [revision, setRevision] = useState(0);

  const refreshGarden = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshGarden();
    }, [refreshGarden]),
  );

  const view = useMemo(() => getGardenView({
    dayState: loadDayState(),
    weekState: loadWeekState(),
    moveHistory: loadMoveHistory(),
    foodHistory: loadFoodHistory(),
    now: new Date(),
  }), [revision]);

  return { view, refreshGarden };
}
