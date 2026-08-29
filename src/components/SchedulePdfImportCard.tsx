import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { readSchedulePdf } from '@/src/import/schedulePdf';
import type { ReviewShift } from '@/src/import/scheduleOcr';
import { loadUserProfile, loadWeekState, saveUserProfile, saveWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

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

export function SchedulePdfImportCard() {
  const initialName = loadUserProfile().scheduleName;
  const [scheduleName, setScheduleName] = useState(initialName);
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [review, setReview] = useState<ReviewShift[] | null>(null);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function choosePdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.name });
    setReview(null);
    setWarnings([]);
    setMatchedName(null);
  }

  async function readPdf() {
    if (!file) return;
    const cleanName = scheduleName.trim();
    if (cleanName.length < 2) {
      Alert.alert('Falta tu nombre', 'Escribe cómo apareces en la planilla.');
      return;
    }

    setReading(true);
    setReview(null);
    setWarnings([]);
    try {
      const parsed = await readSchedulePdf(file.uri, cleanName);
      setMatchedName(parsed.matchedNameText);
      setWarnings(parsed.warnings);
      if (!parsed.nameFound) {
        Alert.alert('No te encontré', parsed.warnings[0] ?? 'No pude encontrar tu nombre en este PDF.');
        return;
      }
      setReview(parsed.shifts);
    } catch (error) {
      console.error('WeekFlow PDF import failed', error);
      const message = error instanceof Error && error.message === 'PDF_NO_TEXT'
        ? 'Este PDF parece ser una imagen escaneada y no trae texto seleccionable. Usa “Elegir captura” o la cámara para leerlo con OCR.'
        : 'No pude leer este PDF. Tu semana no fue modificada.';
      setWarnings([message]);
      Alert.alert('No pude leer el PDF', message);
    } finally {
      setReading(false);
    }
  }

  function patchShift(day: number, patch: Partial<ReviewShift>) {
    setReview((current) => current?.map((shift) => {
      if (shift.day !== day) return shift;
      const next = { ...shift, ...patch };
      if (next.off) return { ...next, type: 'off', breakMinutes: 0, issue: null, confidence: 'high' };
      const validBreak = next.breakMinutes !== null && next.breakMinutes >= 0 && next.breakMinutes <= 180;
      next.issue = validTime(next.start) && validTime(next.end) && validBreak ? null : 'Revisa entrada, colación y salida.';
      next.confidence = next.issue ? 'medium' : 'high';
      next.type = inferType(next.start, next.end);
      return next;
    }) ?? null);
  }

  function toggleOff(day: number) {
    setReview((current) => current?.map((shift) => shift.day !== day ? shift : shift.off
      ? { ...shift, off: false, type: 'custom', start: '', end: '', breakMinutes: 30, issue: 'Ingresa entrada y salida.', confidence: 'medium' }
      : { ...shift, off: true, type: 'off', start: '', end: '', breakMinutes: 0, issue: null, confidence: 'high' }) ?? null);
  }

  const ready = Boolean(review?.length === 7 && review.every((shift) => shift.off || (
    validTime(shift.start)
    && validTime(shift.end)
    && shift.breakMinutes !== null
    && shift.breakMinutes >= 0
    && shift.breakMinutes <= 180
    && !shift.issue
  )));

  function confirm() {
    if (!review || !ready) {
      Alert.alert('Revisa la semana', 'Corrige los días pendientes antes de confirmar.');
      return;
    }
    const currentWeek = loadWeekState();
    saveUserProfile({ scheduleName: scheduleName.trim() });
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
      source: 'pdf',
    });
    Alert.alert('PDF revisado', 'Tu jornada quedó preparada. Revisa Semana y termina el Ritual de la Semana.', [
      { text: 'Continuar', onPress: () => router.replace('/week') },
    ]);
  }

  if (review) {
    return (
      <View style={styles.reviewBox}>
        <Text style={styles.eyebrow}>PDF · REVISAR ANTES DE GUARDAR</Text>
        <Text style={styles.title}>{matchedName ? `Encontré a ${matchedName}` : 'Revisa tu semana'}</Text>
        <Text style={styles.copy}>El PDF solo prepara una propuesta. Nada cambia hasta que confirmes.</Text>
        {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
        {review.map((shift) => (
          <View key={shift.day} style={styles.shiftRow}>
            <View style={styles.shiftHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.day}>{shift.label}</Text>
                <Text style={shift.issue ? styles.issue : styles.ok}>{shift.issue ?? 'Listo para confirmar'}</Text>
              </View>
              <Pressable style={[styles.offButton, shift.off && styles.offActive]} onPress={() => toggleOff(shift.day)}>
                <Text style={styles.offText}>Día libre</Text>
              </Pressable>
            </View>
            {!shift.off ? (
              <View style={styles.times}>
                <TextInput value={shift.start} onChangeText={(start) => patchShift(shift.day, { start })} placeholder="Entrada" placeholderTextColor="#60728E" style={styles.input} maxLength={5} />
                <TextInput value={shift.breakMinutes === null ? '' : String(shift.breakMinutes)} onChangeText={(value) => patchShift(shift.day, { breakMinutes: value ? Number(value.replace(/\D/g, '').slice(0, 3)) : null })} placeholder="Colación" placeholderTextColor="#60728E" keyboardType="number-pad" style={styles.input} maxLength={3} />
                <TextInput value={shift.end} onChangeText={(end) => patchShift(shift.day, { end })} placeholder="Salida" placeholderTextColor="#60728E" style={styles.input} maxLength={5} />
              </View>
            ) : null}
          </View>
        ))}
        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => setReview(null)}><Text style={styles.secondaryText}>Volver</Text></Pressable>
          <Pressable style={[styles.primary, !ready && styles.disabled]} disabled={!ready} onPress={confirm}><Text style={styles.primaryText}>Confirmar semana</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>IMPORTAR PDF</Text>
      <Text style={styles.title}>Horario en PDF</Text>
      <Text style={styles.copy}>Para PDFs digitales con texto. Si es un escaneo, usa foto/captura para aplicar OCR.</Text>
      <TextInput value={scheduleName} onChangeText={setScheduleName} placeholder="Tu nombre en la planilla" placeholderTextColor="#60728E" style={styles.nameInput} />
      <Pressable style={styles.fileButton} onPress={choosePdf}>
        <Text style={styles.fileTitle}>{file ? file.name : 'Elegir archivo PDF'}</Text>
        <Text style={styles.fileSub}>{file ? 'Toca para cambiarlo' : 'Se revisará antes de guardar'}</Text>
      </Pressable>
      {warnings.map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
      {file ? (
        <Pressable style={[styles.primary, reading && styles.disabled]} disabled={reading} onPress={readPdf}>
          {reading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Leer PDF</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 10 },
  reviewBox: { marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  eyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 1.8, fontSize: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  nameInput: { marginTop: 4, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#28558B', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, fontWeight: '800' },
  fileButton: { padding: 14, borderRadius: 16, backgroundColor: '#0B1E35', borderWidth: 1, borderColor: '#28558B' },
  fileTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  fileSub: { color: colors.muted, fontSize: 11, marginTop: 4 },
  warning: { color: '#E7C67A', fontSize: 12, lineHeight: 18, marginTop: 6 },
  shiftRow: { marginTop: 10, padding: 11, borderRadius: 15, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  shiftHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  day: { color: colors.text, fontWeight: '900', fontSize: 13 },
  issue: { color: '#E7C67A', fontSize: 10, marginTop: 2 },
  ok: { color: '#78D7A6', fontSize: 10, marginTop: 2 },
  offButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8 },
  offActive: { borderColor: '#438E6A', backgroundColor: '#113224' },
  offText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  times: { flexDirection: 'row', gap: 7, marginTop: 9 },
  input: { flex: 1, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 7, paddingVertical: 9, color: colors.text, fontSize: 12, textAlign: 'center', fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  primary: { flex: 1, minHeight: 48, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondary: { flex: 1, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
