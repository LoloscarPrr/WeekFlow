import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Brand } from '@/src/components/Brand';
import {
  crashReportingConsentEnabled,
  setCrashReportingConsent,
} from '@/src/privacy/crashReporting';
import {
  WEEKFLOW_PRIVACY_POLICY_UPDATED,
  WEEKFLOW_PRIVACY_POLICY_URL,
} from '@/src/privacy/policy';
import { colors } from '@/src/theme/colors';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const [reportingEnabled, setReportingEnabled] = useState(crashReportingConsentEnabled);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function changeCrashReporting(enabled: boolean) {
    if (saving) return;
    setSaving(true);
    const result = await setCrashReportingConsent(enabled);
    setReportingEnabled(result.enabled);
    setFeedback(
      result.applied
        ? result.enabled
          ? 'Activado. Se enviarán únicamente informes técnicos de fallos.'
          : 'Desactivado. Los informes pendientes del teléfono fueron eliminados.'
        : 'La preferencia quedó guardada, pero no pudo aplicarse en este momento.',
    );
    setSaving(false);
  }

  async function openFullPolicy() {
    try {
      await Linking.openURL(WEEKFLOW_PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('No se pudo abrir', 'Inténtalo nuevamente cuando tengas conexión.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
      >
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PRIVACIDAD</Text>
          <Text style={styles.title}>Tus datos siguen siendo tuyos<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.intro}>
            WeekFlow funciona principalmente en tu teléfono. Tus horarios y registros no se suben
            a una cuenta ni se usan para publicidad.
          </Text>
        </View>

        <PrivacyCard
          title="Guardado local"
          body="Jornadas, comidas, movimiento, descanso y preferencias se guardan en la base local de la app. Las imágenes y archivos que eliges se procesan para importar tu horario; WeekFlow no los envía a sus servidores."
        />

        <PrivacyCard
          title="Permisos con contexto"
          body="La cámara y el selector de archivos se abren únicamente cuando tú eliges importar un horario. Las notificaciones son recordatorios locales programados en tu dispositivo."
        />

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.cardTitle}>Informes de fallos</Text>
              <Text style={styles.cardBody}>
                Opcional. Al activarlos, Firebase Crashlytics recibe datos técnicos del fallo,
                versión de la app, modelo y sistema del dispositivo e identificadores de instalación.
                WeekFlow no adjunta deliberadamente tus horarios, fotos ni registros personales.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Enviar informes técnicos de fallos"
              disabled={saving}
              value={reportingEnabled}
              onValueChange={changeCrashReporting}
              trackColor={{ false: '#34445D', true: colors.blueStrong }}
              thumbColor={reportingEnabled ? '#FFFFFF' : '#C7D1DF'}
            />
          </View>
          <Text style={styles.defaultOff}>
            {reportingEnabled ? 'ACTIVADO POR TI' : 'DESACTIVADO POR DEFECTO'}
          </Text>
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </View>

        <PrivacyCard
          title="Sin venta ni publicidad"
          body="WeekFlow no vende tus datos, no contiene anuncios y no crea una cuenta. Si activas los informes de fallos, Google Firebase actúa como proveedor técnico para ayudarnos a corregir errores."
        />

        <Pressable style={styles.policyButton} onPress={openFullPolicy}>
          <View style={styles.policyCopy}>
            <Text style={styles.policyTitle}>Política de privacidad completa</Text>
            <Text style={styles.policyMeta}>Actualizada el {WEEKFLOW_PRIVACY_POLICY_UPDATED}</Text>
          </View>
          <Text style={styles.arrow}>↗</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  back: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  backText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  hero: { marginTop: 18, marginBottom: 2 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 2.5, fontSize: 12 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  blue: { color: colors.blue },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 17,
  },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  switchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  switchCopy: { flex: 1 },
  defaultOff: {
    color: '#76AFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.3,
    marginTop: 14,
  },
  feedback: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 7 },
  policyButton: {
    minHeight: 72,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.blueStrong,
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  policyCopy: { flex: 1 },
  policyTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  policyMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 22 },
});
