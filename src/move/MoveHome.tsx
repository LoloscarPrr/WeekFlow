import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { MoveFeedback } from '@/src/move/MoveFeedback';
import { MovePlan } from '@/src/move/MovePlan';
import { moveStyles as styles } from '@/src/move/styles';
import type { MoveController } from '@/src/move/useMoveController';

export function MoveHome({ move }: { move: MoveController }) {
  const scrollRef = useRef<ScrollView>(null);

  function keepFeedbackVisible() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <RefreshableScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Brand />
          <PillarTabs active="move" />
          <Text style={styles.eyebrow}>PILARES · MOVE</Text>
          <Text style={styles.title}>Una sesión real, no una etiqueta.</Text>
          <Text style={styles.copy}>WeekFlow arma una guía concreta con el tiempo y energía que tienes. Puedes pausarla, cambiar un ejercicio o terminar antes.</Text>
          {move.finished ? <MoveFeedback move={move} onNoteFocus={keepFeedbackVisible} /> : <MovePlan move={move} />}
        </RefreshableScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
