import { useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MoveHome } from '@/src/move/MoveHome';
import { MovePlayer } from '@/src/move/MovePlayer';
import { useMoveController } from '@/src/move/useMoveController';

export default function MoveScreen() {
  const move = useMoveController();
  const { moveSlotId } = useLocalSearchParams<{ moveSlotId?: string }>();
  const lastRequested = useRef<string | null>(null);

  useEffect(() => {
    if (!moveSlotId || typeof moveSlotId !== 'string') {
      lastRequested.current = null;
      return;
    }
    if (lastRequested.current === moveSlotId) return;
    // Opening an agenda item only prepares it. Playback still requires the
    // user's explicit tap on «Empezar sesión guiada».
    if (move.prepareWeeklySessionById(moveSlotId)) lastRequested.current = moveSlotId;
  }, [moveSlotId, move.activeSession]);

  if (move.activeSession && move.runtime) return <MovePlayer move={move} />;
  return <MoveHome move={move} />;
}