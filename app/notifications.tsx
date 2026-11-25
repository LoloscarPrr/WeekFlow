import { useEffect, useState } from 'react';
import { requestClosedAppPushTest } from '@/src/notifications/remotePushTest';
import { AppState } from 'react-native';
import { openExactAlarmPermissionSettings, offerExactAlarmAccessIfNeeded } from '@/src/notifications/exactAlarmPermission';
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
import { loadDayState, loadWeekState, loadWeekStateForDate } from '@/src/state/persistence';
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
  const window = nextProtectedRestWindow(loadDayState(), loadWeekState(), new Date(), loadWeekStateForDate);
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

  useEffect(() => {
    void refreshDiagnostics();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshDiagnostics();
    });
    return () => subscription.remove();
  }, []);

  async function openExactAlarmSettings() {
    setCheckingDiagnostics(true);
    try {
      const result = await openExactAlarmPermissionSettings();
      if (result === 'app-details') {
        setStatus('Android abrió los detalles de WeekFlow: busca «Otros permisos» o «Alarmas y recordatorios».');
      } else if (result === 'unavailable') {
        setStatus('No fue posible abrir el acceso especial desde WeekFlow. Revisa los ajustes de Xiaomi.');
        await Linking.openSettings();
      } else if (result === 'not-needed') {
        setStatus('En esta versión de Android no se requiere un permiso especial para las alarmas exactas.');
      } else {
        setStatus('Revisa el permiso de «Alarmas y recordatorios» y regresa a WeekFlow. Se comprobará nuevamente.');
      }
    } catch {
      setStatus('No fue posible abrir la configuración de alarmas de Android.');
    } finally {
      setCheckingDiagnostics(false);
    }
  }

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


  async function testRemotePush() {
    setCheckingDiagnostics(true);
    try {
      const at = await requestClosedAppPushTest();
      setStatus('Prueba remota solicitada para ' + at.toLocaleTimeString('es-CL') + '. Sal de WeekFlow y bloquea el teléfono. Solicitud aceptada no significa entrega.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No fue posible solicitar la prueba remota.');
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
      })
      .finally(() => {
        if (saved.enabled) void offerExactAlarmAccessIfNeeded();
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

        {preferences.enabled ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Alarmas y recordatorios</Text>
            <Text style={styles.permissionState}>
              {diagnostics?.exactAlarmPermission === 'allowed'
                ? '✓ Acceso especial permitido'
                : diagnostics?.exactAlarmPermission === 'blocked'
                  ? 'Acceso especial pendiente'
                  : 'Comprobando acceso especial'}
            </Text>
            <Text style={styles.permissionHelp}>
              Android controla por separado los avisos normales y las alarmas con hora. WeekFlow necesita que autorices este acceso para mejorar su puntualidad.
            </Text>
            {diagnostics?.exactAlarmPermission !== 'allowed' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Revisar alarmas exactas y abrir el permiso especial de Android"
                style={styles.permissionAction}
                disabled={checkingDiagnostics}
                onPress={() => void openExactAlarmSettings()}
              >
                <Text style={styles.permissionActionText}>Activar alarmas exactas</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

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
          <Text style={[styles.statusBody, diagnostics?.exactAlarmPermission === 'blocked' && styles.statusWarning]}>Alarmas exactas: {diagnostics?.exactAlarmPermission === 'allowed' ? 'permitidas' : diagnostics?.exactAlarmPermission === 'blocked' ? 'sin permiso especial' : 'sin verificar'}</Text>
          <Text style={styles.statusBody}>Canal de recordatorios: {diagnostics?.channelEnabled === null || diagnostics === null ? 'no disponible' : diagnostics.channelEnabled ? 'activo' : 'bloqueado'}</Text>
          <Text style={styles.statusBody}>Recordatorios pendientes en Android: {diagnostics?.scheduledManagedCount ?? '—'}</Text>
          <Text style={styles.statusBody}>Antes de la última sincronización: {diagnostics?.beforeLastSyncManagedCount ?? '—'} avisos pendientes</Text>
          <Text style={styles.statusBody}>Última revisión: {diagnostics?.lastSyncAt ? new Date(diagnostics.lastSyncAt).toLocaleString('es-CL') : 'Sin datos en esta sesión'}</Text>
          {diagnostics?.exactAlarmPermission === 'blocked' ? (
            <Text style={styles.statusWarning}>Android no ha permitido programar alarmas exactas. Los recordatorios con hora pueden retrasarse.</Text>
          ) : null}
          {diagnostics?.exactAlarmPermission === 'unavailable' ? (
            <Text style={styles.statusBody}>No se pudo comprobar el permiso especial en este dispositivo. Los avisos pendientes no confirman su entrega.</Text>
          ) : null}
          <Text style={styles.statusBody}>«Alarmas y recordatorios» es un permiso distinto de Notificaciones. En Xiaomi también puedes revisar batería «Sin restricciones». Android puede retrasar alarmas durante el reposo.</Text>
          <Pressable style={styles.diagnosticButton} disabled={checkingDiagnostics} onPress={() => void testNotification()} accessibilityRole="button" accessibilityLabel="Probar notificación en cinco segundos">
            <Text style={styles.diagnosticButtonText}>Probar notificación en 5 segundos</Text>
          </Pressable>
          <Pressable style={styles.diagnosticLink} disabled={checkingDiagnostics} onPress={() => void testLongIdle()} accessibilityRole="button" accessibilityLabel="Probar alarma de agenda después de 24 horas">
            <Text style={styles.diagnosticButtonText}>Probar alarma con fecha en 24 horas</Text>
          </Pressable>
          <Text style={styles.statusBody}>Piloto remoto: envía solo el identificador push de este teléfono al servidor WeekFlow, con tu cuenta verificada. No envía tu agenda ni modifica alarmas. Requiere internet y autorización del piloto.</Text>
          <Pressable style={styles.diagnosticLink} disabled={checkingDiagnostics || !preferences.enabled} onPress={() => void testRemotePush()} accessibilityRole="button">
            <Text style={styles.diagnosticButtonText}>Probar push con WeekFlow cerrada (15 s)</Text>
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
  permissionCard: { marginTop: 10, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: '#36669B', backgroundColor: colors.surface },
  permissionTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  permissionState: { color: '#9EC6F6', fontWeight: '800', fontSize: 12, marginTop: 4 },
  permissionHelp: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  permissionAction: { minHeight: 48, marginTop: 12, backgroundColor: '#2E77D9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  permissionActionText: { color: colors.text, fontSize: 14, fontWeight: '900' },
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
  statusWarning: { color: '#F3C581', fontSize: 12, lineHeight: 18, marginTop: 6 },
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
