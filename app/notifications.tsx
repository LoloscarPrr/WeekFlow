import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/src/notifications/persistence';
import type { NotificationPreferences } from '@/src/notifications/core';
import { nextProtectedRestWindow } from '@/src/notifications/smartSilence';
import { syncLivePlanReminders } from '@/src/services/notifications';
import { loadDayState, loadWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

type PreferenceKey = 'departure' | 'important' | 'rest';

const rows: {
  key: PreferenceKey;
  icon: string;
  title: string;
  body: string;
}[] = [
  {
    key: 'departure',
    icon: '🚇',
    title: 'Salida al trabajo',
    body: 'Te avisa cuando corresponde salir según tu entrada, traslado y margen.',
  },
  {
    key: 'important',
    icon: '⏰',
    title: 'Momentos importantes',
    body: 'Un aviso antes de los eventos importantes que guardaste en Semana.',
  },
  {
    key: 'rest',
    icon: '🌙',
    title: 'Rest',
    body: 'Te recuerda cuándo empezar a bajar el ritmo antes de una jornada.',
  },
];

function hm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function protectedWindowLabel() {
  const window = nextProtectedRestWindow(loadDayState(), loadWeekState());
  if (!window) return 'No hay una ventana de descanso próxima que proteger.';
  return `Próximo descanso protegido: ${hm(window.startsAt)}–${hm(window.endsAt)}.`;
}

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState(() => loadNotificationPreferences());
  const [status, setStatus] = useState('Los cambios se guardan en este teléfono.');
  const [restProtectionLabel, setRestProtectionLabel] = useState(() => protectedWindowLabel());

  function apply(next: NotificationPreferences) {
    const saved = saveNotificationPreferences(next);
    setPreferences(saved);
    setRestProtectionLabel(protectedWindowLabel());
    setStatus(saved.enabled ? 'Actualizando recordatorios…' : 'Recordatorios de WeekFlow apagados.');

    void syncLivePlanReminders()
      .then((count) => {
        if (!saved.enabled) {
          setStatus('Recordatorios de WeekFlow apagados.');
          return;
        }
        setStatus(count > 0
          ? `${count} ${count === 1 ? 'recordatorio programado' : 'recordatorios programados'}.`
          : 'Preferencias guardadas. No hay avisos futuros que programar ahora.');
      })
      .catch(() => {
        setStatus('Preferencias guardadas. No pudimos actualizar los avisos del sistema ahora.');
      });
  }

  function setCategory(key: PreferenceKey, value: boolean) {
    apply({ ...preferences, [key]: value });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>NOTIFICACIONES</Text>
          <Text style={styles.title}>Solo avisos que tengan sentido.</Text>
          <Text style={styles.lead}>
            Tú eliges qué momentos pueden interrumpirte. WeekFlow no necesita avisarte de todo.
          </Text>
        </View>

        <View style={styles.masterCard}>
          <View style={styles.rowCopy}>
            <Text style={styles.cardTitle}>Permitir recordatorios de WeekFlow</Text>
            <Text style={styles.cardBody}>
              Al activarlos, Android puede pedirte permiso. Si los apagas, WeekFlow cancela sus recordatorios programados.
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={(enabled) => apply({ ...preferences, enabled })}
            accessibilityLabel="Permitir recordatorios de WeekFlow"
          />
        </View>

        <Text style={styles.section}>QUÉ QUIERES RECIBIR</Text>

        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.key} style={[styles.preferenceCard, !preferences.enabled && styles.disabledCard]}>
              <View style={styles.iconWrap}><Text style={styles.icon}>{row.icon}</Text></View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>{row.title}</Text>
                <Text style={styles.cardBody}>{row.body}</Text>
              </View>
              <Switch
                value={preferences[row.key]}
                onValueChange={(value) => setCategory(row.key, value)}
                disabled={!preferences.enabled}
                accessibilityLabel={row.title}
              />
            </View>
          ))}
        </View>

        <Text style={styles.section}>DESCANSO PROTEGIDO</Text>

        <View style={styles.masterCard}>
          <View style={styles.rowCopy}>
            <Text style={styles.cardTitle}>Proteger mi descanso</Text>
            <Text style={styles.cardBody}>
              Durante tu ventana principal de sueño, WeekFlow silencia avisos secundarios. Salida al trabajo, Rest y momentos importantes siguen permitidos.
            </Text>
            <Text style={styles.protectedWindow}>{restProtectionLabel}</Text>
          </View>
          <Switch
            value={preferences.smartSilence}
            onValueChange={(smartSilence) => apply({ ...preferences, smartSilence })}
            disabled={!preferences.enabled}
            accessibilityLabel="Proteger mi descanso"
          />
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado</Text>
          <Text style={styles.statusBody}>{status}</Text>
        </View>

        <Text style={styles.footer}>
          Esta protección usa tu plan Rest y tus turnos. Es una regla visible y reversible; no aprende ni cambia tus preferencias por su cuenta.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 140 },
  hero: { marginTop: 24, marginBottom: 20 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  masterCard: {
    minHeight: 100,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A5D99',
    backgroundColor: '#102A4D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 28, marginBottom: 10 },
  list: { gap: 10 },
  preferenceCard: {
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  disabledCard: { opacity: 0.55 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: '#285785',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  rowCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  statusCard: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
  },
  statusTitle: { color: '#8BBEFF', fontWeight: '900', fontSize: 12 },
  statusBody: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 4 },
  protectedWindow: { color: '#8BBEFF', fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 8 },
  footer: { color: '#7187A6', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18 },
});
