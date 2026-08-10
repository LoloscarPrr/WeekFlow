import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';
import { parseScheduleOcr, type ReviewShift } from '@/src/import/scheduleOcr';
import { loadUserProfile, saveUserProfile, saveWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

export type PendingScheduleImport = {
  source: 'image';
  uri: string;
  fileName: string | null;
  width: number;
  height: number;
};

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function inferType(start: string, end: string): ReviewShift['type'] {
  if (!validTime(start) || !validTime(end)) return 'custom';
  const startHour = Number(start.slice(0, 2));
  const endHour = Number(end.slice(0, 2));
  if (endHour < startHour || startHour >= 19) return 'night';
  if (startHour < 11) return 'morning';
  if (startHour >= 12 && startHour < 19) return 'afternoon';
  return 'custom';
}

export function ScheduleImportCard() {
  const initialName = loadUserProfile().scheduleName;
  const [pending, setPending] = useState<PendingScheduleImport | null>(null);
  const [scheduleName, setScheduleName] = useState(initialName);
  const [editingName, setEditingName] = useState(!initialName);
  const [reading, setReading] = useState(false);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [review, setReview] = useState<ReviewShift[] | null>(null);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPending({ source: 'image', uri: asset.uri, fileName: asset.fileName ?? null, width: asset.width, height: asset.height });
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
  }

  function discard() {
    setPending(null);
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
  }

  async function readSchedule() {
    if (!pending) return;
    const cleanName = scheduleName.trim();
    if (cleanName.length < 2) {
      setEditingName(true);
      Alert.alert('Falta tu nombre', 'Escribe cómo apareces en la planilla.');
      return;
    }

    setReading(true);
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
    saveUserProfile({ scheduleName: cleanName });
    setEditingName(false);

    try {
      const result = await recognizeText(pending.uri);
      const parsed = parseScheduleOcr(result as any, cleanName);
      setMatchedName(parsed.matchedNameText);
      setWarnings(parsed.warnings);
      if (!parsed.nameFound) {
        Alert.alert('No te encontré', parsed.warnings[0] ?? 'No pude encontrar tu nombre en esta imagen.');
        return;
      }
      setReview(parsed.shifts);
    } catch (error) {
      console.error('WeekFlow OCR failed', error);
      setWarnings(['No pude leer esta imagen. Prueba con una captura más nítida y completa.']);
      Alert.alert('No pude leer la planilla', 'Prueba con una captura más nítida y completa. Tu semana no fue modificada.');
    } finally {
      setReading(false);
    }
  }

  function patchShift(day: number, patch: Partial<ReviewShift>) {
    setReview((current) => current?.map((shift) => {
      if (shift.day !== day) return shift;
      const next = { ...shift, ...patch };
      if (patch.start !== undefined || patch.end !== undefined) {
        next.type = next.off ? 'off' : inferType(next.start, next.end);
        next.issue = null;
        next.confidence = 'high';
      }
      return next;
    }) ?? null);
  }

  function toggleOff(day: number) {
    setReview((current) => current?.map((shift) => {
      if (shift.day !== day) return shift;
      if (shift.off) return { ...shift, off: false, type: 'custom', start: '', end: '', issue: 'Ingresa entrada y salida.' };
      return { ...shift, off: true, type: 'off', start: '', end: '', issue: null, confidence: 'high' };
    }) ?? null);
  }

  const readyToConfirm = Boolean(review?.length === 7 && review.every((shift) => shift.off || (validTime(shift.start) && validTime(shift.end))));

  function confirmWeek() {
    if (!review || !readyToConfirm) {
      Alert.alert('Revisa la semana', 'Corrige los días pendientes antes de confirmar.');
      return;
    }

    saveWeekState({
      shifts: review.map((shift) => ({
        day: shift.day,
        start: shift.off ? '' : shift.start,
        end: shift.off ? '' : shift.end,
        type: shift.off ? 'off' : inferType(shift.start, shift.end),
      })),
    });

    Alert.alert('Semana confirmada', 'Tu semana ya quedó actualizada.', [
      { text: 'Ver Semana', onPress: () => router.replace('/week') },
    ]);
  }

  if (review) {
    return (
      <View style={styles.reviewBox}>
        <Text style={styles.reviewEyebrow}>REVISAR</Text>
        <Text style={styles.reviewTitle}>{matchedName ? `Encontré a ${matchedName}` : 'Revisa tu semana'}</Text>
        <Text style={styles.reviewCopy}>Solo corrige lo que esté marcado. Nada se guarda hasta confirmar.</Text>

        {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}

        {review.map((shift) => (
          <View key={shift.day} style={styles.shiftRow}>
            <View style={styles.dayColumn}>
              <Text style={styles.day}>{shift.label}</Text>
              <Text style={shift.issue ? styles.issue : styles.ok}>{shift.issue ? 'Revisar' : 'Listo'}</Text>
            </View>
            <Pressable style={[styles.offButton, shift.off && styles.offButtonActive]} onPress={() => toggleOff(shift.day)}>
              <Text style={[styles.offText, shift.off && styles.offTextActive]}>Libre</Text>
            </Pressable>
            {!shift.off ? (
              <View style={styles.times}>
                <TextInput value={shift.start} onChangeText={(start) => patchShift(shift.day, { start })} placeholder="--:--" placeholderTextColor="#60728E" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} />
                <Text style={styles.dash}>–</Text>
                <TextInput value={shift.end} onChangeText={(end) => patchShift(shift.day, { end })} placeholder="--:--" placeholderTextColor="#60728E" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} />
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => setReview(null)}><Text style={styles.secondaryText}>Volver</Text></Pressable>
          <Pressable style={[styles.primarySmall, !readyToConfirm && styles.disabled]} onPress={confirmWeek} disabled={!readyToConfirm}>
            <Text style={styles.primaryText}>Confirmar semana</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {editingName ? (
        <View style={styles.nameBox}>
          <Text style={styles.inputLabel}>Tu nombre en la planilla</Text>
          <TextInput
            value={scheduleName}
            onChangeText={setScheduleName}
            placeholder="Ej. OSCAR"
            placeholderTextColor="#60728E"
            autoCapitalize="characters"
            style={styles.input}
          />
          <Text style={styles.helper}>Solo hace falta configurarlo una vez.</Text>
        </View>
      ) : (
        <View style={styles.identityRow}>
          <View>
            <Text style={styles.identityLabel}>Buscando en la planilla</Text>
            <Text style={styles.identityName}>{scheduleName}</Text>
          </View>
          <Pressable onPress={() => setEditingName(true)}><Text style={styles.editText}>Cambiar</Text></Pressable>
        </View>
      )}

      {!pending ? (
        <Pressable style={styles.primary} onPress={chooseImage}>
          <Text style={styles.primaryIcon}>▣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryTitle}>Elegir captura</Text>
            <Text style={styles.primarySub}>Foto o screenshot de tu horario</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.pendingBox}>
            <Image source={{ uri: pending.uri }} style={styles.preview} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.ready}>Captura lista</Text>
              <Text style={styles.meta} numberOfLines={1}>{pending.fileName ?? 'Imagen seleccionada'}</Text>
            </View>
            <Pressable onPress={discard}><Text style={styles.editText}>Cambiar</Text></Pressable>
          </View>
          {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
          <Pressable style={[styles.readButton, reading && styles.disabled]} onPress={readSchedule} disabled={reading}>
            {reading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Leer mi horario</Text>}
          </Pressable>
          <Text style={styles.safetyText}>Primero lees y revisas. Después decides si guardar.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  nameBox: { padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  inputLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: { marginTop: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#28558B', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 12, marginTop: 7 },
  identityRow: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identityLabel: { color: colors.muted, fontSize: 12 },
  identityName: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  editText: { color: '#78B7FF', fontSize: 13, fontWeight: '900' },
  primary: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#245791', borderRadius: 24, padding: 18 },
  primaryIcon: { color: '#78C8FF', fontSize: 30, fontWeight: '900' },
  primaryTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  primarySub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  chevron: { color: colors.blue, fontSize: 34 },
  pendingBox: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  preview: { width: 68, height: 68, borderRadius: 14, backgroundColor: colors.surface2 },
  ready: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  readButton: { backgroundColor: colors.blue, borderRadius: 18, paddingVertical: 15, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  safetyText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  warning: { color: '#E7C67A', fontSize: 12, lineHeight: 18 },
  reviewBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16 },
  reviewEyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 2.5, fontSize: 11 },
  reviewTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 7 },
  reviewCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 5 },
  shiftRow: { marginTop: 10, padding: 11, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayColumn: { width: 78 },
  day: { color: colors.text, fontWeight: '900', fontSize: 12 },
  issue: { color: '#E7C67A', fontSize: 10, marginTop: 3, fontWeight: '800' },
  ok: { color: '#78D7A6', fontSize: 10, marginTop: 3, fontWeight: '800' },
  offButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 9 },
  offButtonActive: { borderColor: '#438E6A', backgroundColor: '#113224' },
  offText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  offTextActive: { color: '#8EE5B2' },
  times: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  timeInput: { width: 60, borderRadius: 11, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 7, paddingVertical: 8, color: colors.text, fontSize: 12, textAlign: 'center', fontWeight: '900' },
  dash: { color: colors.muted, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, minHeight: 48 },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  primarySmall: { flex: 1, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
