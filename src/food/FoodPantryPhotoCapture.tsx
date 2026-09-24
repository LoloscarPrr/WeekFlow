import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';
import {
  confirmedPhotoPantryItems,
  foodPhotoCandidatesFromOcr,
  type FoodPhotoCandidate,
} from './photoPantry';
import { parseFoodPantryInput, type FoodPantryItem } from './pantry';
import { colors } from '@/src/theme/colors';

export function FoodPantryPhotoCapture({
  onConfirm,
}: {
  onConfirm: (items: FoodPantryItem[]) => void;
}) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [candidates, setCandidates] = useState<FoodPhotoCandidate[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [manualText, setManualText] = useState('');
  const [issue, setIssue] = useState<string | null>(null);

  function reset() {
    setImageUri(null);
    setReading(false);
    setCandidates([]);
    setSelectedKeys([]);
    setManualText('');
    setIssue(null);
  }

  async function processAsset(asset: ImagePicker.ImagePickerAsset) {
    setImageUri(asset.uri);
    setReading(true);
    setCandidates([]);
    setSelectedKeys([]);
    setManualText('');
    setIssue(null);

    try {
      const recognized = await recognizeText(asset.uri);
      const next = foodPhotoCandidatesFromOcr(recognized);
      setCandidates(next);
      setSelectedKeys(next.map((item) => item.key));
      if (!next.length) {
        setIssue('No reconocí nombres de ingredientes en la imagen. Puedes escribir abajo lo que ves y confirmarlo igual.');
      }
    } catch (error) {
      console.error('WeekFlow Food photo recognition failed', error);
      setIssue('No pude leer esta imagen. Puedes completar manualmente sin que la foto modifique tu despensa.');
    } finally {
      setReading(false);
    }
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    await processAsset(result.assets[0]);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permiso de cámara',
        'Necesito permiso para fotografiar ingredientes. También puedes elegir una imagen de la galería o escribirlos manualmente.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    await processAsset(result.assets[0]);
  }

  function toggleCandidate(key: string) {
    setSelectedKeys((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  }

  function confirm() {
    const items = confirmedPhotoPantryItems(candidates, selectedKeys, manualText);
    if (!items.length) return;
    onConfirm(items);
    reset();
  }

  const manualItems = parseFoodPantryInput(manualText);
  const canConfirm = selectedKeys.length > 0 || manualItems.length > 0;

  if (!imageUri) {
    return (
      <View style={styles.actions}>
        <Pressable style={styles.sourceButton} onPress={takePhoto}>
          <Text style={styles.sourceIcon}>📷</Text>
          <View style={styles.sourceCopy}>
            <Text style={styles.sourceTitle}>Tomar foto</Text>
            <Text style={styles.sourceMeta}>Lee nombres visibles</Text>
          </View>
        </Pressable>
        <Pressable style={styles.sourceButton} onPress={chooseImage}>
          <Text style={styles.sourceIcon}>🖼️</Text>
          <View style={styles.sourceCopy}>
            <Text style={styles.sourceTitle}>Elegir foto</Text>
            <Text style={styles.sourceMeta}>Desde galería</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>REVISAR FOTO</Text>
          <Text style={styles.reviewTitle}>Confirma lo que realmente tienes</Text>
        </View>
        <Pressable onPress={reset} style={styles.closeButton}>
          <Text style={styles.closeText}>Cancelar</Text>
        </Pressable>
      </View>

      <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

      {reading ? (
        <View style={styles.reading}>
          <ActivityIndicator />
          <Text style={styles.readingText}>Leyendo nombres y etiquetas visibles…</Text>
        </View>
      ) : (
        <>
          {issue ? <Text style={styles.issue}>{issue}</Text> : null}

          {candidates.length ? (
            <>
              <Text style={styles.helper}>Toca un candidato para quitarlo o volver a incluirlo. Nada se guarda hasta confirmar.</Text>
              <View style={styles.chips}>
                {candidates.map((candidate) => {
                  const selected = selectedKeys.includes(candidate.key);
                  return (
                    <Pressable
                      key={candidate.key}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleCandidate(candidate.key)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {selected ? '✓ ' : '○ '}{candidate.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.manualLabel}>¿La foto no detectó algo?</Text>
          <TextInput
            value={manualText}
            onChangeText={setManualText}
            placeholder="Ej: tomate, huevos, arroz"
            placeholderTextColor="#607493"
            style={styles.input}
            multiline
          />
          <Text style={styles.privacy}>
            La imagen se procesa en el teléfono para esta revisión. WeekFlow no guarda la foto en tu despensa.
          </Text>

          <Pressable
            style={[styles.confirmButton, !canConfirm && styles.disabled]}
            disabled={!canConfirm}
            onPress={confirm}
          >
            <Text style={styles.confirmText}>
              Agregar {selectedKeys.length + manualItems.length} a mi despensa
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  sourceButton: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#315E8B',
    backgroundColor: '#102A49',
    paddingHorizontal: 10,
  },
  sourceIcon: { fontSize: 19 },
  sourceCopy: { flex: 1 },
  sourceTitle: { color: '#D9E9FD', fontSize: 11, fontWeight: '900' },
  sourceMeta: { color: '#7898BD', fontSize: 8, marginTop: 2 },
  reviewCard: {
    marginTop: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#315E8B',
    backgroundColor: colors.surface,
    padding: 13,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eyebrow: { color: '#76AFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  reviewTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 3 },
  closeButton: { paddingHorizontal: 8, paddingVertical: 7 },
  closeText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  preview: { width: '100%', height: 150, borderRadius: 14, marginTop: 11, backgroundColor: colors.surface2 },
  reading: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  readingText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  issue: { color: '#E5C779', fontSize: 10, lineHeight: 15, marginTop: 10 },
  helper: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  chipSelected: { borderColor: '#347363', backgroundColor: '#153A31' },
  chipText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  chipTextSelected: { color: '#8CE0C7' },
  manualLabel: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#294768',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.surface2,
    fontSize: 12,
  },
  privacy: { color: '#6F849F', fontSize: 8, lineHeight: 13, marginTop: 7 },
  confirmButton: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
