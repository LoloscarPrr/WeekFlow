import { Pressable, Text, TextInput, View } from 'react-native';
import { moveStyles as styles } from '@/src/move/styles';
import { MOVE_FEEDBACK, moveRecordDuration, type MoveController } from '@/src/move/useMoveController';

type MoveFeedbackProps = {
  move: MoveController;
  onNoteFocus: () => void;
};

export function MoveFeedback({ move, onNoteFocus }: MoveFeedbackProps) {
  const { feedback, feedbackNote, setFeedbackNote, noteSaved, setNoteSaved, lastRecord, applyFeedback, skipFeedback, saveNote, resetFinished } = move;
  if (!lastRecord) return null;

  return (
    <View style={styles.finishCard}>
      <Text style={styles.finishIcon}>✓</Text>
      <Text style={styles.finishTitle}>{lastRecord.endedEarly ? 'Listo por hoy' : 'Sesión completada'}</Text>
      <Text style={styles.finishSummary}>Hecho · {moveRecordDuration(lastRecord)}{typeof lastRecord.actualSeconds === 'number' ? ` · plan ${lastRecord.plannedMinutes} min` : ''}</Text>
      <Text style={styles.finishCopy}>¿Cómo se sintió esta sesión?</Text>
      <View style={styles.feedbackWrap}>
        {MOVE_FEEDBACK.map((item) => (
          <Pressable key={item} style={[styles.feedbackButton, feedback === item && styles.feedbackActive]} onPress={() => applyFeedback(item)}>
            <Text style={[styles.feedbackText, feedback === item && styles.feedbackTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.feedbackHint}>Si cierras WeekFlow antes de responder, esta pregunta volverá a aparecer hoy. Puedes omitirla si no quieres responder.</Text>
      <Text style={styles.noteLabel}>Comentario opcional</Text>
      <TextInput
        value={feedbackNote}
        onChangeText={(value) => { setFeedbackNote(value); setNoteSaved(false); }}
        onFocus={onNoteFocus}
        placeholder="Escribe una nota breve"
        placeholderTextColor="#64758F"
        multiline
        maxLength={240}
        style={styles.noteInput}
      />
      <Pressable style={styles.noteButton} onPress={saveNote}><Text style={styles.noteButtonText}>{noteSaved ? 'Nota guardada ✓' : 'Guardar nota'}</Text></Pressable>
      <Pressable style={styles.secondaryWide} onPress={feedback ? resetFinished : skipFeedback}>
        <Text style={styles.secondaryButtonText}>{feedback ? 'Volver a Move' : 'Ahora no'}</Text>
      </Pressable>
    </View>
  );
}
