import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';
import { parseScheduleOcr, type ReviewShift } from '@/src/import/scheduleOcr';
import {
  loadUserProfile,
  loadWeekState,
  saveUserProfile,
  saveWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

export type PendingScheduleImport = {
  source: 'library' | 'camera';
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

function validBreakMinutes(value: number | null) {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= 180;
}

function reviewIssue(start: string, end: string, breakMinutes: number | null) {
  if (!validTime(start) || !validTime(end)) return 'Usa formato HH:MM en entrada y salida.';
  if (!validBreakMinutes(breakMinutes)) return 'Revisa la duración de colación (0 a 180 min).';
  return null;
}

function sourceLabel(source: PendingScheduleImport['source']) {
  return source === 'camera' ? 'Foto tomada con la cámara' : 'Imagen elegida de la galería';
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

  function useAsset(asset: ImagePicker.ImagePickerAsset, source: PendingScheduleImport['source']) {
    setPending({
      source,
      uri: asset.uri,
      fileName: asset.fileName ?? null,
      width: asset.width,
      height: asset.height,
    });
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    useAsset(result.assets[0], 'library');
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso de cámara', 'Necesito permiso para fotografiar tu horario. También puedes elegir una captura desde la galería.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    useAsset(result.assets[0], 'camera');
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
      if (patch.start !== undefined || patch.end !== undefined || patch.breakMinutes !== undefined) {
        if (next.off) return {
          ...next,
          type: 'off',
          breakMinutes: 0,
          issue: null,
          confidence: 'high',
        };
        const issue = reviewIssue(next.start, next.end, next.breakMinutes);
        next.type = inferType(next.start, next.end);
        next.issue = issue;
        next.confidence = issue ? 'medium' : 'high';
      }
      return next;
    }) ?? null);
  }

  function toggleOff(day: number) {
    setReview((current) => current?.map((shift) => {
      if (shift.day !== day) return shift;
      if (shift.off) {
        return {
          ...shift,
          off: false,
          type: 'custom',
          start: '',
          end: '',
          breakMinutes: 30,
          issue: 'Ingresa entrada y salida.',
          confidence: 'medium',
        };
      }
      return {
        ...shift,
        off: true,
        type: 'off',
        start: '',
        end: '',
        breakMinutes: 0,
        issue: null,
        confidence: 'high',
      };
    }) ?? null);
  }

  const readyToConfirm = Boolean(
    review?.length === 7
      && review.every((shift) => shift.off || (
        validTime(shift.start)
        && validTime(shift.end)
        && validBreakMinutes(shift.breakMinutes)
        && !shift.issue
      )),
  );

  function confirmWeek() {
    if (!review || !readyToConfirm) {
      Alert.alert('Revisa la semana', 'Corrige los días pendientes antes de confirmar.');
      return;
    }

    const cleanName = scheduleName.trim();
    const currentWeek = loadWeekState();
    saveUserProfile({ scheduleName: cleanName });
    saveWeekState({
      shifts: review.map((shift) => ({
        day: shift.day,
        start: shift.off ? '' : shift.start,
        end: shift.off ? '' : shift.end,
        breakMinutes: shift.off ? 0 : shift.breakMinutes ?? 0,
        type: shift.off ? 'off' : inferType(shift.start, shift.end),
      })),
      importantMoments: currentWeek.importantMoments,
      organizedAt: null,
      source: pending?.source ?? 'library',
    });

    Alert.alert('Horario revisado', 'Tu jornada ya quedó lista. Ahora añade tus momentos importantes y cierra la organización de la semana.', [
      { text: 'Continuar', onPress: () => router.replace('/week') },
    ]);
  }

  if (review) {
    return (
      <View style={styles.reviewBox}>
        <Text style={styles.reviewEyebrow}>REVISAR ANTES DE GUARDAR</Text>
        <Text style={styles.reviewTitle}>{matchedName ? `Encontré a ${matchedName}` : 'Revisa tu semana'}</Text>
        <Text style={styles.reviewCopy}>WeekFlow propone. Tú confirmas. Solo se guardará la semana cuando pulses “Confirmar semana”.</Text>

        {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}

        {review.map((shift) => (
          <View key={shift.day} style={styles.shiftRow}>
            <View style={styles.shiftHead}>
              <View style={styles.dayColumn}>
                <Text style={styles.day}>{shift.label}</Text>
                <Text style={shift.issue ? styles.issue : styles.ok}>{shift.issue ? shift.issue : 'Listo para confirmar'}</Text>
              </View>
              <Pressable style={[styles.offButton, shift.off && styles.offButtonActive]} onPress={() => toggleOff(shift.day)}>
                <Text style={[styles.offText, shift.off && styles.offTextActive]}>Día libre</Text>
              </Pressable>
            </View>
            {!shift.off ? (
              <View style={styles.reviewTimes}>
                <View style={styles.reviewField}>
                  <Text style={styles.reviewLabel}>ENTRADA</Text>
                  <TextInput
                    value={shift.start}
                    onChangeText={(start) => patchShift(shift.day, { start })}
                    placeholder="--:--"
                    placeholderTextColor="#60728E"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    style={[styles.timeInput, shift.issue && styles.timeInputIssue]}
                  />
                </View>
                <View style={styles.reviewField}>
                  <Text style={styles.reviewLabel}>COLACIÓN · MIN</Text>
                  <TextInput
                    value={shift.breakMinutes === null ? '' : String(shift.breakMinutes)}
                    onChangeText={(value) => {
                      const digits = value.replace(/\D/g, '').slice(0, 3);
                      patchShift(shift.day, { breakMinutes: digits ? Number(digits) : null });
                    }}
                    placeholder="30"
                    placeholderTextColor="#60728E"
                    keyboardType="number-pad"
                    maxLength={3}
                    style={[styles.timeInput, shift.issue && styles.timeInputIssue]}
                  />
                </View>
                <View style={styles.reviewField}>
                  <Text style={styles.reviewLabel}>SALIDA</Text>
                  <TextInput
                    value={shift.end}
                    onChangeText={(end) => patchShift(shift.day, { end })}
                    placeholder="--:--"
                    placeholderTextColor="#60728E"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    style={[styles.timeInput, shift.issue && styles.timeInputIssue]}
                  />
                </View>
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
          <Text style={styles.helper}>Lo usamos solo para encontrar tu fila. Se guardará cuando confirmes una importación.</Text>
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
        <>
          <View style={styles.sourceGrid}>
            <Pressable style={styles.sourceButton} onPress={takePhoto}>
              <Text style={styles.sourceIcon}>◉</Text>
              <Text style={styles.sourceTitle}>Tomar foto</Text>
              <Text style={styles.sourceSub}>Usa la cámara ahora</Text>
            </Pressable>
            <Pressable style={styles.sourceButton} onPress={chooseImage}>
              <Text style={styles.sourceIcon}>▣</Text>
              <Text style={styles.sourceTitle}>Elegir captura</Text>
              <Text style={styles.sourceSub}>Foto o screenshot</Text>
            </Pressable>
          </View>
          <View style={styles.ruleBox}>
            <Text style={styles.ruleTitle}>Regla de WeekFlow</Text>
            <Text style={styles.ruleCopy}>La lectura automática nunca modifica tu semana sin que revises y confirmes el resultado.</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.pendingBox}>
            <Image source={{ uri: pending.uri }} style={styles.preview} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.ready}>Imagen lista</Text>
              <Text style={styles.meta}>{sourceLabel(pending.source)}</Text>
              <Text style={styles.meta} numberOfLines={1}>{pending.fileName ?? `${pending.width} × ${pending.height}`}</Text>
            </View>
            <Pressable onPress={discard}><Text style={styles.editText}>Cambiar</Text></Pressable>
          </View>
          {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
          <Pressable style={[styles.readButton, reading && styles.disabled]} onPress={readSchedule} disabled={reading}>
            {reading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Leer mi horario</Text>}
          </Pressable>
          <Text style={styles.safetyText}>La lectura prepara una propuesta. Tu semana actual sigue intacta hasta confirmar.</Text>
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
  helper: { color: colors.muted, fontSize: 12, marginTop: 7, lineHeight: 17 },
  identityRow: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identityLabel: { color: colors.muted, fontSize: 12 },
  identityName: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  editText: { color: '#78B7FF', fontSize: 13, fontWeight: '900' },
  sourceGrid: { flexDirection: 'row', gap: 10 },
  sourceButton: { flex: 1, minHeight: 132, justifyContent: 'center', backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#245791', borderRadius: 22, padding: 16 },
  sourceIcon: { color: '#78C8FF', fontSize: 28, fontWeight: '900', marginBottom: 12 },
  sourceTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  sourceSub: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  ruleBox: { padding: 15, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  ruleTitle: { color: '#8EEBD8', fontSize: 12, fontWeight: '900' },
  ruleCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  pendingBox: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  preview: { width: 68, height: 68, borderRadius: 14, backgroundColor: colors.surface2 },
  ready: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  readButton: { backgroundColor: colors.blue, borderRadius: 18, paddingVertical: 15, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  safetyText: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  disabled: { opacity: 0.45 },
  warning: { color: '#E7C67A', fontSize: 12, lineHeight: 18 },
  reviewBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16 },
  reviewEyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 2.1, fontSize: 10 },
  reviewTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 7 },
  reviewCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 5 },
  shiftRow: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, gap: 10 },
  shiftHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dayColumn: { flex: 1 },
  day: { color: colors.text, fontWeight: '900', fontSize: 13 },
  issue: { color: '#E7C67A', fontSize: 10, lineHeight: 14, marginTop: 3, fontWeight: '800' },
  ok: { color: '#78D7A6', fontSize: 10, marginTop: 3, fontWeight: '800' },
  offButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 9 },
  offButtonActive: { borderColor: '#438E6A', backgroundColor: '#113224' },
  offText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  offTextActive: { color: '#8EE5B2' },
  reviewTimes: { flexDirection: 'row', gap: 8 },
  reviewField: { flex: 1, gap: 5 },
  reviewLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  timeInput: { width: '100%', borderRadius: 11, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 7, paddingVertical: 9, color: colors.text, fontSize: 12, textAlign: 'center', fontWeight: '900' },
  timeInputIssue: { borderColor: '#8B6B37' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, minHeight: 48 },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  primarySmall: { flex: 1, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
