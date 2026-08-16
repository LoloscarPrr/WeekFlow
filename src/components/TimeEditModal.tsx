import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/src/theme/colors';

type TimeEditModalProps = {
  visible: boolean;
  title: string;
  description: string;
  initialTime: string;
  saveLabel?: string;
  onCancel: () => void;
  onSave: (time: string) => void;
};

function splitTime(value: string) {
  const [rawHours = '', rawMinutes = ''] = value.split(':');
  return {
    hours: rawHours.replace(/\D/g, '').slice(0, 2),
    minutes: rawMinutes.replace(/\D/g, '').slice(0, 2),
  };
}

function currentParts() {
  const now = new Date();
  return {
    hours: String(now.getHours()).padStart(2, '0'),
    minutes: String(now.getMinutes()).padStart(2, '0'),
  };
}

export function TimeEditModal({
  visible,
  title,
  description,
  initialTime,
  saveLabel = 'Guardar hora',
  onCancel,
  onSave,
}: TimeEditModalProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const initial = splitTime(initialTime);
    setHours(initial.hours);
    setMinutes(initial.minutes);
    setError('');
  }, [initialTime, visible]);

  function updateHours(value: string) {
    setHours(value.replace(/\D/g, '').slice(0, 2));
    setError('');
  }

  function updateMinutes(value: string) {
    setMinutes(value.replace(/\D/g, '').slice(0, 2));
    setError('');
  }

  function useCurrentTime() {
    const current = currentParts();
    setHours(current.hours);
    setMinutes(current.minutes);
    setError('');
  }

  function keepActionsVisible() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
  }

  function cancel() {
    Keyboard.dismiss();
    onCancel();
  }

  function save() {
    const hourValue = Number(hours);
    const minuteValue = Number(minutes);
    if (
      hours.length === 0
      || minutes.length === 0
      || !Number.isInteger(hourValue)
      || !Number.isInteger(minuteValue)
      || hourValue < 0
      || hourValue > 23
      || minuteValue < 0
      || minuteValue > 59
    ) {
      setError('Escribe una hora válida entre 00:00 y 23:59.');
      return;
    }

    Keyboard.dismiss();
    onSave(`${String(hourValue).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')}`);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cancel}
          accessibilityRole="button"
          accessibilityLabel="Cerrar editor de hora"
        />
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card} accessibilityViewIsModal>
            <Text style={styles.eyebrow}>CORREGIR REGISTRO</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            <View style={styles.timeRow}>
              <View style={styles.field}>
                <Text style={styles.label}>Hora</Text>
                <TextInput
                  value={hours}
                  onChangeText={updateHours}
                  onFocus={keepActionsVisible}
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  accessibilityLabel="Hora, de cero a veintitrés"
                />
              </View>
              <Text style={styles.separator}>:</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Minutos</Text>
                <TextInput
                  value={minutes}
                  onChangeText={updateMinutes}
                  onFocus={keepActionsVisible}
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  accessibilityLabel="Minutos, de cero a cincuenta y nueve"
                  onSubmitEditing={save}
                />
              </View>
            </View>

            <Pressable style={styles.nowButton} onPress={useCurrentTime}>
              <Text style={styles.nowButtonText}>Usar la hora actual</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={cancel}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={save}>
                <Text style={styles.saveText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 3, 16, 0.78)',
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#2A5D99',
    borderRadius: 24,
    padding: 20,
  },
  eyebrow: { color: '#76AFFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '900', marginTop: 8 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 20 },
  field: { flex: 1 },
  label: { color: '#9AB5D8', fontSize: 11, fontWeight: '900', marginBottom: 7 },
  input: {
    height: 58,
    borderWidth: 1,
    borderColor: '#315A88',
    borderRadius: 15,
    backgroundColor: colors.surface2,
    color: colors.text,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
  },
  separator: { color: '#76AFFF', fontSize: 28, fontWeight: '900', paddingBottom: 12 },
  nowButton: { alignSelf: 'flex-start', paddingVertical: 10, marginTop: 7 },
  nowButtonText: { color: '#8FC0FF', fontSize: 12, fontWeight: '900' },
  error: { color: '#FFAEAE', fontSize: 12, lineHeight: 18, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 18 },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
  },
  cancelText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  saveButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    borderRadius: 14,
  },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
