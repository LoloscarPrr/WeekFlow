import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ImportantMoment, WeekSchedule } from '@/src/domain/entities/Shift';
import { scheduleReminder } from '@/src/services/notifications';
import { colors } from '@/src/theme/colors';

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

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function defaultTime(date = new Date()) {
  const next = new Date(date.getTime() + 60 * 60_000);
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function WeekRitualCard({ week, workDays, freeDays, onSaveMoment, onDeleteMoment, onFinish }: Props) {
  const organized = Boolean(week.organizedAt);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => localDateKey());
  const [time, setTime] = useState(() => defaultTime());
  const [testing, setTesting] = useState(false);
  const testInFlight = useRef(false);

  const sortedMoments = useMemo(
    () => [...week.importantMoments].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [week.importantMoments],
  );

  function finish() {
    onFinish();
    Alert.alert(
      'Semana organizada',
      `${workDays} ${workDays === 1 ? 'jornada' : 'jornadas'} y ${freeDays} ${freeDays === 1 ? 'día libre' : 'días libres'}. Tu horario queda como la base real de WeekFlow.`,
    );
  }

  function saveMoment() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Falta el nombre', 'Escribe qué quieres recordar.');
      return;
    }
    if (!validDate(date)) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD.');
      return;
    }
    if (!validTime(time)) {
      Alert.alert('Hora inválida', 'Usa el formato HH:MM en 24 horas.');
      return;
    }

    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isNaN(parsed.getTime())) {
      Alert.alert('Fecha inválida', 'Revisa la fecha y hora.');
      return;
    }

    const mondayBasedDay = (parsed.getDay() + 6) % 7;
    onSaveMoment({
      id: `moment-${Date.now()}`,
      date,
      day: mondayBasedDay,
      time,
      title: cleanTitle,
    });
    setTitle('');
    Alert.alert('Momento guardado', `${cleanTitle} · ${date} · ${time}`);
  }

  async function testNotification() {
    if (testInFlight.current) return;
    testInFlight.current = true;
    setTesting(true);
    try {
      const at = new Date(Date.now() + 8_000);
      const result = await scheduleReminder({
        id: 'manual-notification-test',
        title: 'WeekFlow está listo 🔔',
        body: 'Esta es una notificación de prueba. Si la ves, Android y WeekFlow están comunicándose bien.',
        at,
        kind: 'general',
      });
      if (!result) {
        Alert.alert('No se pudo programar', 'Revisa que WeekFlow tenga permiso para mostrar notificaciones.');
        return;
      }
      Alert.alert('Prueba programada', 'Debería llegar en unos 8 segundos. Puedes salir de la app para comprobarlo.');
    } catch {
      Alert.alert('Error', 'No se pudo programar la notificación de prueba.');
    } finally {
      testInFlight.current = false;
      setTesting(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.statusHead}>
        <View style={[styles.statusIcon, organized && styles.statusIconDone]}>
          <Text style={styles.statusIconText}>{organized ? '✓' : '○'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SEMANA · CIERRE</Text>
          <Text style={styles.title}>{organized ? 'Horario confirmado' : 'Confirma tu semana'}</Text>
          <Text style={styles.copy}>
            {organized
              ? 'Tu jornada real queda como la base de Ahora, Move, Food y Rest.'
              : 'Revisa tus jornadas y días libres. Si todo coincide, confirma y sigue.'}
          </Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <Text style={styles.sourceLabel}>ORIGEN</Text>
        <Text style={styles.sourceValue}>{sourceLabel(week.source)}</Text>
      </View>

      <View style={styles.momentBox}>
        <Text style={styles.assistantEyebrow}>MOMENTOS IMPORTANTES</Text>
        <Text style={styles.assistantTitle}>Añade fecha y hora.</Text>
        <Text style={styles.assistantCopy}>WeekFlow los usará para recordarte compromisos concretos sin mezclarlos con tu jornada laboral.</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Dentista, reunión, trámite"
          placeholderTextColor="#63758A"
          style={styles.input}
        />
        <View style={styles.inputRow}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#63758A"
            style={[styles.input, styles.halfInput]}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            placeholderTextColor="#63758A"
            style={[styles.input, styles.halfInput]}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <Pressable style={styles.saveMomentButton} onPress={saveMoment}>
          <Text style={styles.saveMomentText}>Guardar momento</Text>
        </Pressable>

        {sortedMoments.length ? (
          <View style={styles.momentList}>
            {sortedMoments.map((moment) => (
              <View key={moment.id} style={styles.momentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.momentTitle}>{moment.title}</Text>
                  <Text style={styles.momentMeta}>{moment.date} · {moment.time}</Text>
                </View>
                <Pressable style={styles.deleteButton} onPress={() => onDeleteMoment(moment.id)}>
                  <Text style={styles.deleteText}>Eliminar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyMoments}>Todavía no tienes momentos importantes guardados.</Text>
        )}
      </View>

      <Pressable style={styles.testButton} onPress={testNotification} disabled={testing}>
        <Text style={styles.testText}>{testing ? 'Programando…' : '🔔 Enviar notificación de prueba'}</Text>
      </Pressable>

      {!organized ? (
        <Pressable style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishText}>Confirmar semana</Text>
        </Pressable>
      ) : (
        <Text style={styles.doneCopy}>Si cambias una jornada, WeekFlow volverá a pedirte esta confirmación.</Text>
      )}
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
  momentBox: { marginTop: 14, padding: 14, borderRadius: 17, backgroundColor: '#0B1B31', borderWidth: 1, borderColor: '#28558B' },
  assistantEyebrow: { color: '#76AFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  assistantTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 6 },
  assistantCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  input: { minHeight: 46, marginTop: 12, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#07111F', borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 13, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  saveMomentButton: { minHeight: 46, marginTop: 10, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  saveMomentText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  momentList: { marginTop: 12, gap: 8 },
  momentRow: { minHeight: 58, padding: 11, borderRadius: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  momentTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  momentMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#703B48' },
  deleteText: { color: '#FF9BAD', fontSize: 10, fontWeight: '900' },
  emptyMoments: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12 },
  testButton: { minHeight: 48, marginTop: 14, borderRadius: 15, backgroundColor: '#173C68', borderWidth: 1, borderColor: '#2F6EAD', alignItems: 'center', justifyContent: 'center' },
  testText: { color: '#DCEEFF', fontSize: 12, fontWeight: '900' },
  finishButton: { minHeight: 52, marginTop: 16, borderRadius: 16, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  finishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  doneCopy: { color: '#86BBA5', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 15 },
});
