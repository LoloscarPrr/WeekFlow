import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { moveStyles as styles } from '@/src/move/styles';
import { formatMoveTime, type MoveController } from '@/src/move/useMoveController';

export function MovePlayer({ move }: { move: MoveController }) {
  const { activeSession, runtime, routine, currentStepIndex, currentExercise, phaseRemainingSeconds, phasePercent, sessionElapsedSeconds, overallPercent, sessionDuration, advanceToNextExercise, completeCurrentExercise, togglePause, switchExercise, finishSession } = move;
  if (!activeSession || !runtime) return null;

  const resting = runtime.phase === 'rest';
  const nextStep = routine.steps[Math.min(currentStepIndex + 1, routine.steps.length - 1)];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.sessionScroll}
        contentContainerStyle={styles.sessionShell}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Brand />
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderCopy}>
            <Text style={styles.sessionEyebrow}>MOVE · SESIÓN</Text>
            <Text style={styles.sessionCounter}>{resting ? 'Descanso' : `Ejercicio ${currentStepIndex + 1} de ${routine.steps.length}`}</Text>
          </View>
          <Text style={styles.sessionElapsed}>{formatMoveTime(sessionElapsedSeconds)}</Text>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.exerciseIdentity}>
            <Text style={styles.playerIcon}>{resting ? '😮‍💨' : currentExercise.icon}</Text>
            <Text style={styles.playerTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>
              {resting ? 'Descanso breve' : currentExercise.title}
            </Text>
          </View>
          <Text style={styles.playerCopy}>{resting ? `Respira y baja un poco el ritmo. Después: ${nextStep.exercise.title}.` : currentExercise.cue}</Text>

          {!resting ? (
            <View style={styles.easyBox}>
              <Text style={styles.easyLabel}>MÁS FÁCIL</Text>
              <Text style={styles.easyCopy}>{currentExercise.easier}</Text>
            </View>
          ) : null}

          <View style={styles.timerBlock}>
            <Text style={styles.timerLabel}>{resting ? 'DESCANSO' : 'ESTE EJERCICIO'}</Text>
            <Text style={styles.timerValue}>{formatMoveTime(phaseRemainingSeconds)}</Text>
          </View>
          <View style={styles.phaseTrack}><View style={[styles.phaseFill, { width: `${phasePercent}%` }]} /></View>

          <View style={styles.overallMeta}>
            <Text style={styles.overallText}>Sesión · {overallPercent}%</Text>
            <Text style={styles.overallText}>Plan · {sessionDuration} min</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${overallPercent}%` }]} /></View>

          <Pressable style={[styles.primaryButton, activeSession.paused && styles.disabled]} onPress={resting ? advanceToNextExercise : completeCurrentExercise} disabled={activeSession.paused}>
            <Text style={styles.primaryButtonText}>{resting ? 'Saltar descanso' : currentStepIndex === routine.steps.length - 1 ? 'Terminar ejercicio' : 'Siguiente'}</Text>
          </Pressable>

          {!resting ? <Pressable style={styles.changeButton} onPress={switchExercise}><Text style={styles.changeButtonText}>Cambiar ejercicio</Text></Pressable> : null}

          <View style={styles.sessionActions}>
            <Pressable style={styles.linkButton} onPress={togglePause}><Text style={styles.linkText}>{activeSession.paused ? 'Continuar' : 'Pausar'}</Text></Pressable>
            <Pressable style={styles.linkButton} onPress={() => finishSession(false)}><Text style={styles.linkText}>Terminar sesión</Text></Pressable>
          </View>

          {activeSession.paused ? <Text style={styles.pauseCopy}>En pausa. Ni el ejercicio ni el tiempo de sesión avanzan.</Text> : null}
          <Text style={styles.safetyCopy}>Muévete a un ritmo cómodo. Si algo duele o te marea, detén la sesión.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}