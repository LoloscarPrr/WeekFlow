import { MoveHome } from '@/src/move/MoveHome';
import { MovePlayer } from '@/src/move/MovePlayer';
import { useMoveController } from '@/src/move/useMoveController';

export default function MoveScreen() {
  const move = useMoveController();
  if (move.activeSession && move.runtime) return <MovePlayer move={move} />;
  return <MoveHome move={move} />;
}