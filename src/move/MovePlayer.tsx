import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { MOVE_INTENSITY_LABELS } from '@/src/move/adaptation';
import {
  exerciseCueForPreferences,
  moveExerciseEquipmentLabel,
  routineStyleLabel,
} from '@/src/move/library';
import { moveStyles as styles } from '@/src/move/styles';
import { formatMoveTime, type MoveController } from '@/src/move/useMoveController';

export function MovePlayer({ move }: { move: MoveController }) {
  const {
    activeSession,
    runtime,
    routine,
    preferences,
    sessionIntensity,
    currentStepIndex,
    stepDefinition,
    currentExercise,
    phaseRemainingSeconds,
    phasePercent,
    sessionElapsedSeconds,
    overallPercent,
    sessionDuration,
    advanceToNextExercise,
    completeCurrentExercise,
    togglePause,
    switchExercise,
    finishSession,
  } = move;
  if (!activeSession || !runtime) return null;

  const resting = runtime.phase === 'rest';
  const isSet = stepDefinition.mode === 'set';
  const isAmrap = stepDefinition.mode === 'amrap';
  const nextStep = routine.steps[Math.min(currentStepIndex + 1, routine.steps.length - 1)];
  const equipment = resting || isAmrap ? null : moveExerciseEquipmentLabel(currentExercise, preferences);

  const counter = resting
    ? 'Descanso'
    : isSet
      ? `Serie ${stepDefinition.setNumber ?? 1} de ${stepDefinition.setCount ?? 1} · ${stepDefinition.blockLabel ?? 'Series'}`
      : isAmrap
        ? `AMRAP · ronda ${stepDefinition.roundNumber ?? 1} de ${stepDefinition.roundCount ?? 1}`
        : `Ejercicio ${currentStepIndex + 1} de ${routine.steps.length}`;

  const restNext = nextStep.mode === 'amrap'
    ? `ronda ${nextStep.roundNumber ?? 1} del AMRAP`
    : nextStep.exercise.title;

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
            <Text style={styles.sessionEyebrow}>MOVE · {MOVE_INTENSITY_LABELS[sessionIntensity].toUpperCase()}</Text>
            <Text style={styles.sessionCounter}>{counter}</Text>
            <Text style={styles.sessionFormat}>{routineStyleLabel(routine.style)}</Text>
          </View>
          <Text style={styles.sessionElapsed}>{formatMoveTime(sessionElapsedSeconds)}</Text>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.exerciseIdentity}>
            <Text style={styles.playerIcon}>{resting ? '😮‍💨' : isAmrap ? '🔁' : currentExercise.icon}</Text>
            <Text style={styles.playerTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>
              {resting ? 'Descanso' : isAmrap ? 'Circuito AMRAP' : currentExercise.title}
            </Text>
            {!resting && !isAmrap ? <Text style={styles.equipmentBadge}>Dificultad {currentExercise.difficulty}/5</Text> : null}
            {equipment ? <Text style={styles.equipmentBadge}>{equipment}</Text> : null}
            {!resting && isSet ? (
              <Text style={styles.prescriptionBadge}>
                Serie {stepDefinition.setNumber}/{stepDefinition.setCount} · {stepDefinition.repsLabel} reps
              </Text>
            ) : null}
          </View>

          {resting ? (
            <Text style={styles.playerCopy}>Respira y recupera. Después: {restNext}.</Text>
          ) : isAmrap ? (
            <View style={styles.amrapBox}>
              <Text style={styles.amrapTitle}>REPETIR DURANTE 5 MIN</Text>
              {(stepDefinition.circuit ?? []).map((item) => (
                <View key={item.exercise.id} style={styles.amrapRow}>
                  <Text style={styles.amrapExercise}>{item.exercise.icon} {item.exercise.title}</Text>
                  <Text style={styles.amrapReps}>{item.repsLabel}</Text>
                </View>
              ))}
              <Text style={styles.amrapHint}>Completa rondas a un ritmo controlable. No necesitas llegar al fallo.</Text>
            </View>
          ) : (
            <Text style={styles.playerCopy}>{exerciseCueForPreferences(currentExercise, preferences)}</Text>
          )}

          {!resting && !isAmrap ? (
            <View style={styles.easyBox}>
              <Text style={styles.easyLabel}>MÁS FÁCIL</Text>
              <Text style={styles.easyCopy}>{currentExercise.easier}</Text>
            </View>
          ) : null}

          {resting || !isSet ? (
            <>
              <View style={styles.timerBlock}>
                <Text style={styles.timerLabel}>{resting ? 'DESCANSO' : isAmrap ? 'RONDA ACTIVA' : 'ESTE EJERCICIO'}</Text>
                <Text style={styles.timerValue}>{formatMoveTime(phaseRemainingSeconds)}</Text>
              </View>
              <View style={styles.phaseTrack}><View style={[styles.phaseFill, { width: `${phasePercent}%` }]} /></View>
            </>
          ) : (
            <View style={styles.repsBlock}>
              <Text style={styles.timerLabel}>OBJETIVO DE ESTA SERIE</Text>
              <Text style={styles.repsValue}>{stepDefinition.repsLabel}</Text>
              <Text style={styles.repsUnit}>repeticiones</Text>
            </View>
          )}

          <View style={styles.overallMeta}>
            <Text style={styles.overallText}>Sesión · {overallPercent}%</Text>
            <Text style={styles.overallText}>Plan · {sessionDuration} min</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${overallPercent}%` }]} /></View>

          <Pressable
            style={[styles.primaryButton, activeSession.paused && styles.disabled]}
            onPress={resting ? advanceToNextExercise : completeCurrentExercise}
            disabled={activeSession.paused}
          >
            <Text style={styles.primaryButtonText}>
              {resting
                ? 'Saltar descanso'
                : isSet
                  ? 'Serie completada'
                  : isAmrap
                    ? 'Terminar ronda'
                    : currentStepIndex === routine.steps.length - 1
                      ? 'Terminar ejercicio'
                      : 'Siguiente'}
            </Text>
          </Pressable>

          {!resting && !isAmrap ? (
            <Pressable style={styles.changeButton} onPress={switchExercise}>
              <Text style={styles.changeButtonText}>Cambiar ejercicio</Text>
            </Pressable>
          ) : null}

          <View style={styles.sessionActions}>
            <Pressable style={styles.linkButton} onPress={togglePause}><Text style={styles.linkText}>{activeSession.paused ? 'Continuar' : 'Pausar'}</Text></Pressable>
            <Pressable style={styles.linkButton} onPress={() => finishSession(false)}><Text style={styles.linkText}>Terminar sesión</Text></Pressable>
          </View>

          {activeSession.paused ? <Text style={styles.pauseCopy}>En pausa. Ni el ejercicio ni el tiempo de sesión avanzan.</Text> : null}
          <Text style={styles.safetyCopy}>Muévete a un ritmo controlable. Si aparece dolor, mareo o una carga deja de sentirse estable, cambia el ejercicio o detén la sesión.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
