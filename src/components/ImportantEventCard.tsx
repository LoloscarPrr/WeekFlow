import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import type { ImportantMoment } from '@/src/domain/entities/Shift';
import {
  defaultImportantEventWhen,
  localDateKey,
  localTimeValue,
  numericLocalDateLabel,
  replaceLocalDate,
  replaceLocalTime,
} from '@/src/domain/services/importantEventDraft';
import { colors } from '@/src/theme/colors';

type PickerMode = 'date' | 'time';

type Props = {
  moments: ImportantMoment[];
  onSave: (moment: ImportantMoment) => void;
  onDelete: (id: string) => void;
};

export function ImportantEventCard({ moments, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(() => defaultImportantEventWhen());
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const sortedMoments = useMemo(
    () => [...moments].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [moments],
  );

  function saveEvent() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Escribe un nombre');
      return;
    }

    onSave({
      id: `moment-${Date.now()}`,
      date: localDateKey(when),
      day: 0,
      time: localTimeValue(when),
      title: cleanTitle,
    });
    setTitle('');
  }

  function applyPickedValue(selected: Date) {
    if (picker === 'date') {
      setWhen((current) => replaceLocalDate(current, selected));
    } else if (picker === 'time') {
      setWhen((current) => replaceLocalTime(current, selected));
    }
    setPicker(null);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Evento importante</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Nombre del evento"
        placeholderTextColor="#63758A"
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={saveEvent}
        style={styles.input}
      />

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir fecha del evento"
          style={[styles.pickerButton, styles.dateButton]}
          onPress={() => setPicker('date')}
        >
          <Text style={styles.pickerText}>{numericLocalDateLabel(localDateKey(when))}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir hora del evento"
          style={styles.pickerButton}
          onPress={() => setPicker('time')}
        >
          <Text style={styles.pickerText}>{localTimeValue(when)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.saveButton} onPress={saveEvent}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </View>

      {sortedMoments.length ? (
        <View style={styles.list}>
          {sortedMoments.map((moment) => (
            <View key={moment.id} style={styles.eventRow}>
              <View style={styles.eventContent}>
                <Text numberOfLines={1} style={styles.eventTitle}>{moment.title}</Text>
                <Text style={styles.eventMeta}>{numericLocalDateLabel(moment.date)} · {moment.time}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${moment.title}`}
                hitSlop={6}
                style={styles.deleteButton}
                onPress={() => onDelete(moment.id)}
              >
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {picker ? (
        <DateTimePicker
          value={when}
          mode={picker}
          presentation="dialog"
          display={picker === 'time' ? 'clock' : 'calendar'}
          is24Hour
          accentColor={colors.blue}
          positiveButton={{ label: 'Aceptar' }}
          negativeButton={{ label: 'Cancelar' }}
          onValueChange={(_, selected) => applyPickedValue(selected)}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  heading: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: {
    minHeight: 44,
    marginTop: 9,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  controls: { flexDirection: 'row', gap: 7, marginTop: 8 },
  pickerButton: {
    minHeight: 44,
    minWidth: 62,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: { flex: 1 },
  pickerText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  saveButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  list: { marginTop: 9, gap: 7 },
  eventRow: {
    minHeight: 52,
    paddingLeft: 11,
    paddingRight: 4,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventContent: { flex: 1, paddingVertical: 8 },
  eventTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  eventMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#FF9BAD', fontSize: 24, lineHeight: 26, fontWeight: '700' },
});
