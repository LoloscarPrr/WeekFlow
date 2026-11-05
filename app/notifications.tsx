import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/src/notifications/persistence';
import type { NotificationPreferences } from '@/src/notifications/core';
import { nextProtectedRestWindow } from '@/src/notifications/smartSilence';
import {
  getNotificationDeliveryDiagnostics,
  scheduleWeekFlowNotificationTest,
  scheduleWeekFlowLongIdleTest,
  syncLivePlanReminders,
  type NotificationDeliveryDiagnostics,
} from '@/src/services/notifications';
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

  const [diagnostics, setDiagnostics] = useState<NotificationDeliveryDiagnostics | null>(null);
  const [checkingDiagnostics, setCheckingDiagnostics] = useState(false);

  async function refreshDiagnostics() {
    setCheckingDiagnostics(true);
    try {
      setDiagnostics(await getNotificationDeliveryDiagnostics());
    } catch {
      setStatus('No pudimos consultar los permisos y las alarmas de Android.');
    } finally {
      setCheckingDiagnostics(false);
    }
  }

  useEffect(() => { void refreshDiagnostics(); }, []);

  async function testNotification() {
    setCheckingDiagnostics(true);
    try {
      await scheduleWeekFlowNotificationTest();
      setStatus('Prueba programada para 5 segundos. Bloquea la pantalla y verifica si llega; que esté programada no confirma la entrega.');
      setDiagnostics(await getNotificationDeliveryDiagnostics());
    } catch {
      setStatus('No se pudo programar la prueba. Revisa los permisos de notificación y alarmas de Android.');
    } finally {
      setCheckingDiagnostics(false);
    }
  }


  async function testLongIdle() {
    setCheckingDiagnostics(true);
    try {
      const at = await scheduleWeekFlowLongIdleTest();
      setStatus(`Prueba de fecha programada para ${at.toLocaleString('es-CL')}. Comprueba si llega puntual después de 24 horas sin abrir WeekFlow. La prueba no modifica tu agenda.`);
      setDiagnostics(await getNotificationDeliveryDiagnostics());
    } catch {
      setStatus('No se pudo programar la prueba de 24 horas. Revisa notificaciones y permisos de alarmas.');
    } finally {
      setCheckingDiagnostics(false);
    }
  }

  function apply(next: NotificationPreferences) {
    const saved = saveNotificationPreferences(next);
    setPreferences(saved);
    setRestProtectionLabel(protectedWindowLabel());
    setStatus(saved.enabled ? 'Actualizando recordatorios…' : 'Recordatorios de WeekFlow apagados.');

    void syncLivePlanReminders()
      .then(async () => {
        const current = await getNotificationDeliveryDiagnostics();
        setDiagnostics(current);
        if (!saved.enabled) {
          setStatus('Recordatorios de WeekFlow apagados.');
        } else if (!current.permissionGranted || current.channelEnabled === false) {
          setStatus('Android está bloqueando notificaciones o el canal de recordatorios.');
        } else {
          setStatus(`${current.scheduledManagedCount} recordatorios activos registrados en Android. Esto no garantiza que el teléfono los entregue.`);
        }
      })
      .catch(() => {
        setStatus('Preferencias guardadas, pero no pudimos verificar los avisos del sistema.');
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
          <Text style={styles.statusTitle}>DIAGNÓSTICO DE ANDROID</Text>
          <Text style={styles.statusBody}>WeekFlow: {diagnostics ? (diagnostics.appEnabled ? 'activado' : 'apagado') : 'comprobando…'}</Text>
          <Text style={styles.statusBody}>Permiso de notificaciones: {diagnostics ? (diagnostics.permissionGranted ? 'permitido' : 'bloqueado') : 'comprobando…'}</Text>
          <Text style={styles.statusBody}>Canal de recordatorios: {diagnostics?.channelEnabled === null || diagnostics === null ? 'no disponible' : diagnostics.channelEnabled ? 'activo' : 'bloqueado'}</Text>
          <Text style={styles.statusBody}>Recordatorios pendientes en Android: {diagnostics?.scheduledManagedCount ?? '—'}</Text>
          <Text style={styles.statusBody}>Antes de la última sincronización: {diagnostics?.beforeLastSyncManagedCount ?? '—'} avisos pendientes</Text>
          <Text style={styles.statusBody}>Última revisión: {diagnostics?.lastSyncAt ? new Date(diagnostics.lastSyncAt).toLocaleString('es-CL') : 'Sin datos en esta sesión'}</Text>
          <Text style={styles.statusBody}>Si la prueba de 5 segundos funciona pero los avisos reales se retrasan, programa la prueba de 24 horas. Es una alarma con fecha, no un temporizador. Android puede aplazarla durante el reposo prolongado.</Text>
          <Text style={styles.statusBody}>En Android 14+ revisa también Ajustes → Apps → Acceso especial → Alarmas y recordatorios → WeekFlow. En Xiaomi/Redmi activa batería «Sin restricciones» y el inicio automático. Android puede retrasar alarmas incluso si aquí aparecen como programadas.</Text>
          <Pressable style={styles.diagnosticButton} disabled={checkingDiagnostics} onPress={() => void testNotification()} accessibilityRole="button" accessibilityLabel="Probar notificación en cinco segundos">
            <Text style={styles.diagnosticButtonText}>Probar notificación en 5 segundos</Text>
          </Pressable>
          <Pressable style={styles.diagnosticLink} disabled={checkingDiagnostics} onPress={() => void testLongIdle()} accessibilityRole="button" accessibilityLabel="Probar alarma de agenda después de 24 horas">
            <Text style={styles.diagnosticButtonText}>Probar alarma con fecha en 24 horas</Text>
          </Pressable>
          <Pressable style={styles.diagnosticLink} disabled={checkingDiagnostics} onPress={() => void refreshDiagnostics()} accessibilityRole="button">
            <Text style={styles.diagnosticButtonText}>Actualizar diagnóstico</Text>
          </Pressable>
          <Pressable style={styles.diagnosticLink} onPress={() => void Linking.openSettings()} accessibilityRole="button">
            <Text style={styles.diagnosticButtonText}>Abrir ajustes de la app</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado</Text>
          <Text style={styles.statusBody}>{status}</Text>
        </View>

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
  diagnosticButton: {
    borderRadius: 12, backgroundColor: '#2E77D9', paddingVertical: 13,
    paddingHorizontal: 12, marginTop: 12, alignItems: 'center',
  },
  diagnosticLink: {
    borderRadius: 12, borderColor: '#2A5D99', borderWidth: 1,
    paddingVertical: 11, paddingHorizontal: 12, marginTop: 8, alignItems: 'center',
  },
  diagnosticButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  protectedWindow: { color: '#8BBEFF', fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 8 },
  footer: { color: '#7187A6', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18 },
});
