import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import type { ImportantMoment, WeekSchedule } from '@/src/domain/entities/Shift';
import { colors } from '@/src/theme/colors';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SHORT_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type Props = {
  week: WeekSchedule;
  workDays: number;
  freeDays: number;
  onSaveMoment: (moment: ImportantMoment) => void;
  onDeleteMoment: (id: string) => void;
  onFinish: () => void;
};

function sourceLabel(source: WeekSchedule['source']) {
  if (source === 'camera') return 'Foto tomada con la cámara';
  if (source === 'library') return 'Imagen elegida de la galería';
  if (source === 'pdf') return 'Documento PDF';
  if (source === 'excel') return 'Planilla Excel';
  if (source === 'legacy') return 'Semana conservada de una versión anterior';
  return 'Ingreso manual';
}

function dateFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function timeFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function newMomentId() {
  return `moment-${Date.now().toString(36)}`;
}

export function WeekRitualCard({
  week,
  workDays,
  freeDays,
  onSaveMoment,
  onDeleteMoment,
  onFinish,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('18:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  function resetEditor() {
    setEditing(false);
    setDraftId(null);
    setTitle('');
    setDay(0);
    setTime('18:00');
    setTimePickerOpen(false);
  }

  function editMoment(moment: ImportantMoment) {
    setDraftId(moment.id);
    setTitle(moment.title);
    setDay(moment.day);
    setTime(moment.time);
    setEditing(true);
  }

  function saveMoment() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Falta el momento', 'Escribe qué quieres proteger esta semana.');
      return;
    }

    onSaveMoment({
      id: draftId ?? newMomentId(),
      day,
      time,
      title: cleanTitle,
    });
    resetEditor();
  }

  function finish() {
    onFinish();
    const moments = week.importantMoments.length;
    Alert.alert(
      'Semana organizada',
      `${workDays} ${workDays === 1 ? 'jornada' : 'jornadas'}, ${freeDays} ${freeDays === 1 ? 'día libre' : 'días libres'} y ${moments} ${moments === 1 ? 'momento importante' : 'momentos importantes'}. Puedes corregir cualquier dato cuando cambie la realidad.`,
    );
  }

  const organized = Boolean(week.organizedAt);

  return (
    <View style={styles.card}>
      <View style={styles.statusHead}>
        <View style={[styles.statusIcon, organized && styles.statusIconDone]}>
          <Text style={styles.statusIconText}>{organized ? '✓' : '○'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>RITUAL DE LA SEMANA</Text>
          <Text style={styles.title}>{organized ? 'Semana organizada' : 'Termina de organizarla'}</Text>
          <Text style={styles.copy}>
            {organized
              ? 'Horario y momentos importantes comparten una sola verdad.'
              : 'Revisa tu horario, protege lo importante y cierra con un resumen simple.'}
          </Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <Text style={styles.sourceLabel}>ORIGEN</Text>
        <Text style={styles.sourceValue}>{sourceLabel(week.source)}</Text>
      </View>

      <View style={styles.momentsHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Momentos importantes</Text>
          <Text style={styles.sectionCopy}>Solo lo que no debe perderse entre las jornadas.</Text>
        </View>
        {!editing ? (
          <Pressable style={styles.addButton} onPress={() => setEditing(true)}>
            <Text style={styles.addButtonText}>+ Añadir</Text>
          </Pressable>
        ) : null}
      </View>

      {week.importantMoments.length ? (
        <View style={styles.momentsList}>
          {week.importantMoments.map((moment) => (
            <View key={moment.id} style={styles.momentRow}>
              <View style={styles.momentWhen}>
                <Text style={styles.momentDay}>{SHORT_DAYS[moment.day]}</Text>
                <Text style={styles.momentTime}>{moment.time}</Text>
              </View>
              <Text style={styles.momentTitle}>{moment.title}</Text>
              <View style={styles.momentActions}>
                <Pressable onPress={() => editMoment(moment)} hitSlop={8}>
                  <Text style={styles.editText}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => onDeleteMoment(moment.id)} hitSlop={8}>
                  <Text style={styles.deleteText}>Quitar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No añadiste nada todavía.</Text>
          <Text style={styles.emptyCopy}>Está bien dejarlo vacío si esta semana no hay otro compromiso que proteger.</Text>
        </View>
      )}

      {editing ? (
        <View style={styles.editor}>
          <Text style={styles.inputLabel}>¿Qué quieres proteger?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Médico, cumpleaños o trámite"
            placeholderTextColor="#60728E"
            maxLength={80}
            returnKeyType="done"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Día</Text>
          <View style={styles.dayGrid}>
            {SHORT_DAYS.map((label, index) => (
              <Pressable
                key={label}
                style={[styles.dayChip, day === index && styles.dayChipActive]}
                onPress={() => setDay(index)}
              >
                <Text style={[styles.dayChipText, day === index && styles.dayChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Hora</Text>
          <Pressable style={styles.timeButton} onPress={() => setTimePickerOpen(true)}>
            <Text style={styles.timeButtonValue}>{time}</Text>
            <Text style={styles.timeButtonHint}>Cambiar</Text>
          </Pressable>

          <View style={styles.editorActions}>
            <Pressable style={styles.cancelButton} onPress={resetEditor}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={saveMoment}>
              <Text style={styles.saveText}>{draftId ? 'Guardar cambio' : 'Añadir momento'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!organized ? (
        <Pressable style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishText}>Terminar organización</Text>
        </Pressable>
      ) : (
        <Text style={styles.doneCopy}>Si editas el horario o un momento, WeekFlow volverá a abrir este cierre para que lo confirmes de nuevo.</Text>
      )}

      {timePickerOpen ? (
        <DateTimePicker
          value={dateFromTime(time)}
          mode="time"
          presentation="dialog"
          display="clock"
          is24Hour
          accentColor={colors.blue}
          onValueChange={(_, selectedDate) => {
            setTime(timeFromDate(selectedDate));
            setTimePickerOpen(false);
          }}
          onDismiss={() => setTimePickerOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16 },
  statusHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F2816', borderWidth: 1, borderColor: '#80662D' },
  statusIconDone: { backgroundColor: '#113A2C', borderColor: '#36795C' },
  statusIconText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  eyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 1.8, fontSize: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  sourceRow: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sourceLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sourceValue: { color: colors.text, fontSize: 11, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  momentsHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  sectionCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  addButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#153C69', borderWidth: 1, borderColor: '#2E6CAE', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#A8D2FF', fontSize: 11, fontWeight: '900' },
  momentsList: { marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  momentRow: { minHeight: 66, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.line },
  momentWhen: { width: 48 },
  momentDay: { color: '#76AFFF', fontSize: 10, fontWeight: '900' },
  momentTime: { color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 3 },
  momentTitle: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800', flex: 1 },
  momentActions: { alignItems: 'flex-end', gap: 7 },
  editText: { color: '#8CC5FF', fontSize: 10, fontWeight: '900' },
  deleteText: { color: '#B69A9A', fontSize: 10, fontWeight: '800' },
  emptyBox: { marginTop: 12, padding: 13, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  editor: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: '#0B1B31', borderWidth: 1, borderColor: '#28558B' },
  inputLabel: { color: '#9BB5D4', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 10, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 14, fontWeight: '800' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dayChip: { minWidth: 57, minHeight: 38, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: '#173E6E', borderColor: '#4B8DD5' },
  dayChipText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  dayChipTextActive: { color: colors.text },
  timeButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeButtonValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  timeButtonHint: { color: '#78B7FF', fontSize: 11, fontWeight: '900' },
  editorActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  cancelButton: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  saveButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  finishButton: { minHeight: 52, marginTop: 16, borderRadius: 16, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  finishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  doneCopy: { color: '#86BBA5', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 15 },
});
