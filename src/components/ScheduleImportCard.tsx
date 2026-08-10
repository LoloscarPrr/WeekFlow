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
  const [pending, setPending] = useState<PendingScheduleImport | null>(null);
  const [scheduleName, setScheduleName] = useState(() => loadUserProfile().scheduleName);
  const [reading, setReading] = useState(false);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [review, setReview] = useState<ReviewShift[] | null>(null);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPending({
      source: 'image',
      uri: asset.uri,
      fileName: asset.fileName ?? null,
      width: asset.width,
      height: asset.height,
    });
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
      Alert.alert('Falta tu nombre', 'Escribe cómo apareces en la planilla antes de continuar.');
      return;
    }

    setReading(true);
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
    saveUserProfile({ scheduleName: cleanName });

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
      if (shift.off) {
        return { ...shift, off: false, type: 'custom', start: '', end: '', issue: 'Ingresa entrada y salida.' };
      }
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

    Alert.alert('Semana confirmada', 'Listo. Tu semana real ya quedó guardada en WeekFlow.', [
      { text: 'Ver Semana', onPress: () => router.replace('/week') },
    ]);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Text style={styles.iconText}>▣</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Importar horario</Text>
          <Text style={styles.copy}>WeekFlow te busca en la planilla, propone tu semana y espera tu confirmación antes de guardar.</Text>
        </View>
      </View>

      <View style={styles.nameBox}>
        <Text style={styles.inputLabel}>¿Cómo apareces en tu horario?</Text>
        <TextInput
          value={scheduleName}
          onChangeText={setScheduleName}
          placeholder="Ej. OSCAR URRUTIA"
          placeholderTextColor="#60728E"
          autoCapitalize="characters"
          style={styles.input}
        />
        <Text style={styles.helper}>Se guarda en el teléfono para futuras importaciones.</Text>
      </View>

      {!pending ? (
        <Pressable style={styles.primary} onPress={chooseImage}>
          <Text style={styles.primaryText}>Elegir foto o captura</Text>
        </Pressable>
      ) : (
        <View style={styles.pendingBox}>
          <Image source={{ uri: pending.uri }} style={styles.preview} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ready}>Imagen lista</Text>
            <Text style={styles.meta} numberOfLines={1}>{pending.fileName ?? 'Captura seleccionada'}</Text>
            <Text style={styles.meta}>{pending.width} × {pending.height}px</Text>
          </View>
        </View>
      )}

      {pending && !review ? (
        <>
          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Nada se guarda antes de revisar</Text>
            <Text style={styles.safetyText}>OCR leerá la imagen en tu dispositivo. Si algo no está claro, WeekFlow lo dejará pendiente.</Text>
          </View>
          {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={discard} disabled={reading}>
              <Text style={styles.secondaryText}>Descartar</Text>
            </Pressable>
            <Pressable style={[styles.primarySmall, reading && styles.disabled]} onPress={readSchedule} disabled={reading}>
              {reading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Leer horario</Text>}
            </Pressable>
          </View>
        </>
      ) : null}

      {review ? (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewEyebrow}>OCR · REVISIÓN</Text>
          <Text style={styles.reviewTitle}>{matchedName ? `Te encontré: ${matchedName}` : 'Revisa tu semana'}</Text>
          <Text style={styles.reviewCopy}>Corrige cualquier dato antes de confirmar. Esta pantalla es la última barrera antes de modificar Semana.</Text>

          {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}

          {review.map((shift) => (
            <View key={shift.day} style={styles.shiftRow}>
              <View style={styles.dayColumn}>
                <Text style={styles.day}>{shift.label}</Text>
                {shift.issue ? <Text style={styles.issue}>Revisar</Text> : <Text style={styles.ok}>Listo</Text>}
              </View>
              <Pressable style={[styles.offButton, shift.off && styles.offButtonActive]} onPress={() => toggleOff(shift.day)}>
                <Text style={[styles.offText, shift.off && styles.offTextActive]}>Libre</Text>
              </Pressable>
              {!shift.off ? (
                <View style={styles.times}>
                  <TextInput value={shift.start} onChangeText={(start) => patchShift(shift.day, { start })} placeholder="07:30" placeholderTextColor="#60728E" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} />
                  <Text style={styles.dash}>–</Text>
                  <TextInput value={shift.end} onChangeText={(end) => patchShift(shift.day, { end })} placeholder="15:30" placeholderTextColor="#60728E" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.timeInput} />
                </View>
              ) : null}
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={() => setReview(null)}>
              <Text style={styles.secondaryText}>Volver a leer</Text>
            </Pressable>
            <Pressable style={[styles.primarySmall, !readyToConfirm && styles.disabled]} onPress={confirmWeek} disabled={!readyToConfirm}>
              <Text style={styles.primaryText}>Confirmar semana</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 26, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  icon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#2D75D8', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#78C8FF', fontSize: 24, fontWeight: '900' },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  nameBox: { marginTop: 17, padding: 14, borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  inputLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: { marginTop: 9, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#28558B', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, color: colors.text, fontSize: 15, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 11, marginTop: 7 },
  primary: { marginTop: 16, backgroundColor: colors.blue, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  primarySmall: { flex: 1, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  pendingBox: { marginTop: 16, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  preview: { width: 74, height: 74, borderRadius: 13, backgroundColor: colors.surface2 },
  ready: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  safety: { marginTop: 13, borderRadius: 16, padding: 13, backgroundColor: '#10271F', borderWidth: 1, borderColor: '#315E43' },
  safetyTitle: { color: '#A4EAC0', fontWeight: '900', fontSize: 13 },
  safetyText: { color: '#91B69E', fontSize: 12, lineHeight: 18, marginTop: 4 },
  warning: { color: '#E7C67A', fontSize: 12, lineHeight: 18, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, minHeight: 48 },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  reviewBox: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 17 },
  reviewEyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 2.5, fontSize: 11 },
  reviewTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 7 },
  reviewCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
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
});
