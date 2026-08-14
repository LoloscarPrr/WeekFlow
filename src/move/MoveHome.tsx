import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { MoveFeedback } from '@/src/move/MoveFeedback';
import { MovePlan } from '@/src/move/MovePlan';
import { moveStyles as styles } from '@/src/move/styles';
import type { MoveController } from '@/src/move/useMoveController';

export function MoveHome({ move }: { move: MoveController }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView contentContainerStyle={styles.content}>
        <Brand />
        <PillarTabs active="move" />
        <Text style={styles.eyebrow}>PILARES · MOVE</Text>
        <Text style={styles.title}>Una sesión real, no una etiqueta.</Text>
        <Text style={styles.copy}>WeekFlow arma una guía concreta con el tiempo y energía que tienes. Puedes pausarla, cambiar un ejercicio o terminar antes.</Text>
        {move.finished ? <MoveFeedback move={move} /> : <MovePlan move={move} />}
      </RefreshableScrollView>
    </SafeAreaView>
  );
}