import { Pressable, Text, View } from 'react-native';
import { MOVE_FOCUS_OPTIONS } from '@/src/move/adaptation';
import { moveStyles as styles } from '@/src/move/styles';
import { MOVE_DURATIONS, moveRecordDuration, type MoveController } from '@/src/move/useMoveController';

export function MovePlan({ move }: { move: MoveController }) {
  const {
    duration,
    setDuration,
    lastRecord,
    extraOpen,
    setExtraOpen,
    preferences,
    setFocus,
    toggleFloorAllowed,
    toggleChairAvailable,
    recommended,
    recommendationCopy,
    useRecommendation,
    preview,
    doneToday,
    startSession,
  } = move;

  return (
    <>
      {doneToday && !extraOpen && lastRecord ? (
        <View style={styles.doneTodayCard}>
          <Text style={styles.doneTodayIcon}>✓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTodayTitle}>Move ya está hecho por hoy</Text>
            <Text style={styles.doneTodayCopy}>{moveRecordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
          </View>
          <Pressable style={styles.extraButton} onPress={() => setExtraOpen(true)}><Text style={styles.extraButtonText}>Otra sesión</Text></Pressable>
        </View>
      ) : null}

      {!doneToday || extraOpen ? (
        <>
          <View style={styles.recommendCard}>
            <View style={styles.recommendTop}>
              <View style={styles.moveIcon}><Text style={styles.moveEmoji}>🏃</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendEyebrow}>{doneToday ? 'OPCIONAL' : 'HOY'}</Text>
                <Text style={styles.recommendTitle}>{recommended} min recomendados</Text>
                <Text style={styles.recommendCopy}>{doneToday ? 'Ya hiciste una sesión. Esta segunda queda totalmente opcional.' : recommendationCopy}</Text>
              </View>
            </View>

            {duration !== recommended ? (
              <Pressable style={styles.recommendUseButton} onPress={useRecommendation}>
                <Text style={styles.recommendUseText}>Usar recomendación de {recommended} min</Text>
              </Pressable>
            ) : null}

            <Text style={styles.smallLabel}>¿Qué necesitas de esta sesión?</Text>
            <View style={styles.focusGrid}>
              {MOVE_FOCUS_OPTIONS.map((item) => {
                const active = preferences.focus === item.value;
                return (
                  <Pressable key={item.value} style={[styles.focusButton, active && styles.focusButtonActive]} onPress={() => setFocus(item.value)}>
                    <Text style={styles.focusIcon}>{item.icon}</Text>
                    <Text style={[styles.focusLabel, active && styles.focusLabelActive]}>{item.label}</Text>
                    <Text style={styles.focusCopy}>{item.copy}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.smallLabel}>Cómo quieres moverte</Text>
            <View style={styles.preferenceRow}>
              <Pressable style={[styles.preferenceButton, preferences.chairAvailable && styles.preferenceButtonActive]} onPress={toggleChairAvailable}>
                <Text style={styles.preferenceIcon}>🪑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.preferenceTitle, preferences.chairAvailable && styles.preferenceTitleActive]}>Tengo una silla</Text>
                  <Text style={styles.preferenceCopy}>Puede usarla como apoyo o para movimientos simples.</Text>
                </View>
                <Text style={styles.preferenceCheck}>{preferences.chairAvailable ? '✓' : '○'}</Text>
              </Pressable>
              <Pressable style={[styles.preferenceButton, preferences.floorAllowed && styles.preferenceButtonActive]} onPress={toggleFloorAllowed}>
                <Text style={styles.preferenceIcon}>⬇️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.preferenceTitle, preferences.floorAllowed && styles.preferenceTitleActive]}>Puede incluir suelo</Text>
                  <Text style={styles.preferenceCopy}>Si está apagado, toda la sesión queda de pie o con silla.</Text>
                </View>
                <Text style={styles.preferenceCheck}>{preferences.floorAllowed ? '✓' : '○'}</Text>
              </Pressable>
            </View>

            <Text style={styles.smallLabel}>¿Cuánto tiempo tienes?</Text>
            <View style={styles.durationRow}>
              {MOVE_DURATIONS.map((item) => (
                <Pressable key={item} style={[styles.duration, duration === item && styles.durationActive]} onPress={() => setDuration(item)}>
                  <Text style={[styles.durationText, duration === item && styles.durationTextActive]}>{item}</Text>
                  <Text style={[styles.durationUnit, duration === item && styles.durationTextActive]}>min</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.primaryButton} onPress={startSession}><Text style={styles.primaryButtonText}>Empezar sesión guiada</Text></Pressable>
          </View>

          <Text style={styles.section}>QUÉ HARÁS</Text>
          <View style={styles.libraryCard}>
            {preview.map((exercise, index) => (
              <View key={exercise.id} style={[styles.libraryRow, index === preview.length - 1 && styles.libraryRowLast]}>
                <Text style={styles.libraryIcon}>{exercise.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.libraryTitle}>{exercise.title}</Text>
                  <Text style={styles.libraryCopy}>{exercise.cue}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.libraryNote}>La vista previa cambia con el enfoque, el tiempo y las opciones de silla/suelo. Puedes cambiar un ejercicio durante la sesión sin perder el progreso.</Text>
          </View>
        </>
      ) : null}

      {!doneToday && lastRecord ? (
        <View style={styles.lastCard}>
          <Text style={styles.lastLabel}>ÚLTIMA SESIÓN</Text>
          <Text style={styles.lastValue}>{moveRecordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}{lastRecord.feedback ? ` · ${lastRecord.feedback}` : ''}</Text>
        </View>
      ) : null}
    </>
  );
}
