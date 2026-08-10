import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/src/theme/colors';

export type PendingScheduleImport = {
  source: 'image';
  uri: string;
  fileName: string | null;
  width: number;
  height: number;
};

export function ScheduleImportCard() {
  const [pending, setPending] = useState<PendingScheduleImport | null>(null);

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
  }

  function discard() {
    setPending(null);
  }

  function explainNextStep() {
    Alert.alert(
      'Importación preparada',
      'Esta imagen todavía no modifica tu semana. La siguiente capa leerá el nombre y las jornadas, y siempre te mostrará una revisión antes de guardar.',
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Text style={styles.iconText}>▣</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Importar horario</Text>
          <Text style={styles.copy}>Foto o captura de tu planilla. WeekFlow nunca cambiará tu semana sin que la revises primero.</Text>
        </View>
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

      {pending ? (
        <>
          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Nada se ha guardado todavía</Text>
            <Text style={styles.safetyText}>La semana actual sigue intacta. El siguiente paso será detectar tu fila, proponer jornadas y pedir confirmación.</Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={discard}>
              <Text style={styles.secondaryText}>Descartar</Text>
            </Pressable>
            <Pressable style={styles.primarySmall} onPress={explainNextStep}>
              <Text style={styles.primaryText}>Continuar</Text>
            </Pressable>
          </View>
        </>
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
  primary: { marginTop: 16, backgroundColor: colors.blue, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  primarySmall: { flex: 1, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pendingBox: { marginTop: 16, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 11, borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  preview: { width: 74, height: 74, borderRadius: 13, backgroundColor: colors.surface2 },
  ready: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  safety: { marginTop: 13, borderRadius: 16, padding: 13, backgroundColor: '#10271F', borderWidth: 1, borderColor: '#315E43' },
  safetyTitle: { color: '#A4EAC0', fontWeight: '900', fontSize: 13 },
  safetyText: { color: '#91B69E', fontSize: 12, lineHeight: 18, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondary: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '800' },
});