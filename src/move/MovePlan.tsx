import { Pressable, Text, View } from 'react-native';
import { moveStyles as styles } from '@/src/move/styles';
import { MOVE_DURATIONS, moveRecordDuration, type MoveController } from '@/src/move/useMoveController';

export function MovePlan({ move }: { move: MoveController }) {
  const { duration, setDuration, lastRecord, extraOpen, setExtraOpen, recommended, todayShift, preview, doneToday, startSession } = move;

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
                <Text style={styles.recommendCopy}>{doneToday ? 'Ya hiciste una sesión. Esta segunda queda totalmente opcional.' : lastRecord?.feedback === 'Difícil' || lastRecord?.feedback === 'Demasiado' ? 'La última sesión se sintió pesada, así que hoy bajamos la carga automáticamente.' : todayShift.type === 'off' ? 'Día libre: puedes elegir con más margen.' : `Turno ${todayShift.start}–${todayShift.end}: mantenemos la sesión acotada.`}</Text>
              </View>
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
            <Text style={styles.libraryNote}>La sesión combina estos movimientos y variantes según la duración elegida.</Text>
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