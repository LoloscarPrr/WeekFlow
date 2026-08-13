import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { buildBrainPlan } from '@/src/brain/engine';
import type { BrainSnapshot, Shift } from '@/src/brain/types';
import {
  loadDayState,
  loadWeekState,
  nextWorkingShift,
  shiftContextForDate,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function isNightShift(shift: Shift) {
  if (shift.type === 'night') return true;
  if (shift.type === 'off' || !shift.start || !shift.end) return false;
  return toMinutes(shift.start) >= 18 * 60 || toMinutes(shift.end) <= 8 * 60 || toMinutes(shift.end) <= toMinutes(shift.start);
}

function formatHm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDayTime(date: Date) {
  const day = date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '');
  return `${day} · ${formatHm(date)}`;
}

function dateForClockNearStart(startAt: Date, clock: string) {
  const [hours, minutes] = clock.split(':').map(Number);
  const date = new Date(startAt);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > startAt.getTime()) date.setDate(date.getDate() - 1);
  return date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export default function RestScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [now, setNow] = useState(() => new Date());

  const refreshRest = useCallback(() => {
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setNow(new Date());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRest();
    }, [refreshRest]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const context = useMemo(() => shiftContextForDate(weekState, now), [now, weekState]);
  const activeStart = context.startAt ? new Date(context.startAt) : null;
  const activeEnd = context.endAt ? new Date(context.endAt) : null;
  const shiftActive = Boolean(activeStart && activeEnd && now >= activeStart && now < activeEnd && context.shift.type !== 'off');
  const activeNight = shiftActive && isNightShift(context.shift);

  const recentNight = useMemo(() => {
    const lookback = new Date(now.getTime() - 6 * 60 * 60_000);
    const candidate = shiftContextForDate(weekState, lookback);
    if (!candidate.endAt || !isNightShift(candidate.shift)) return null;
    const endAt = new Date(candidate.endAt);
    const minutesSinceEnd = (now.getTime() - endAt.getTime()) / 60_000;
    if (minutesSinceEnd < 0 || minutesSinceEnd > 360) return null;
    return { ...candidate, endAtDate: endAt };
  }, [now, weekState]);

  const nextShift = useMemo(() => nextWorkingShift(weekState, now), [now, weekState]);

  const activePlan = useMemo(() => {
    const snapshot: BrainSnapshot = { ...dayState.settings, shift: context.shift, energy: dayState.energy };
    return buildBrainPlan(snapshot);
  }, [context.shift, dayState.energy, dayState.settings]);

  const recoveryPlan = useMemo(() => {
    if (!recentNight) return null;
    const realExitAt = dayState.actualExitAt ? new Date(dayState.actualExitAt) : null;
    const exitAt = realExitAt && Math.abs(now.getTime() - realExitAt.getTime()) <= 8 * 60 * 60_000
      ? realExitAt
      : recentNight.endAtDate;
    const homeAt = addMinutes(exitAt, dayState.settings.commuteBackMin);
    const decompressAt = addMinutes(homeAt, dayState.settings.recoveryMin);
    const sleepAt = addMinutes(decompressAt, 30);
    return { exitAt, homeAt, decompressAt, sleepAt };
  }, [dayState.actualExitAt, dayState.settings.commuteBackMin, dayState.settings.recoveryMin, now, recentNight]);

  const nextRest = useMemo(() => {
    if (!nextShift) return null;
    const nextStart = new Date(nextShift.startAt);
    const snapshot: BrainSnapshot = { ...dayState.settings, shift: nextShift.shift, energy: dayState.energy };
    const plan = buildBrainPlan(snapshot);
    const wake = plan.moments.find((item) => item.type === 'wake');
    if (!wake) return null;
    const wakeAt = dateForClockNearStart(nextStart, wake.time);
    const sleepAt = addMinutes(wakeAt, -8 * 60);
    const windDownAt = addMinutes(sleepAt, -45);
    return { nextStart, wakeAt, sleepAt, windDownAt, shift: nextShift.shift };
  }, [dayState.energy, dayState.settings, nextShift]);

  const activeRecovery = useMemo(() => {
    if (!activeNight) return null;
    const commute = activePlan.moments.find((item) => item.type === 'commute-back');
    const recovery = activePlan.moments.find((item) => item.type === 'recovery');
    const rest = activePlan.moments.find((item) => item.type === 'rest');
    return commute && recovery && rest ? { commute, recovery, rest } : null;
  }, [activeNight, activePlan.moments]);

  let heroTitle = 'Tu descanso se adapta a tu semana.';
  let contextTitle = 'Día abierto';
  let contextCopy = 'No hay una jornada activa que obligue a una hora fija. Rest deja espacio y mira la próxima entrada antes de proponerte un cierre.';
  let contextMeta = 'Sin presión por completar una rutina.';

  if (activeNight && activeRecovery && activeEnd) {
    heroTitle = 'Después de la noche, recuperar va primero.';
    contextTitle = 'Turno nocturno en curso';
    contextCopy = 'No voy a poner productividad detrás de la salida. El orden es regreso, bajar revoluciones y descanso.';
    contextMeta = `Salida ${formatHm(activeEnd)} · regreso aprox. ${activeRecovery.commute.time} · descanso ${activeRecovery.rest.time}`;
  } else if (shiftActive && activeEnd) {
    contextTitle = 'Jornada en curso';
    contextCopy = 'Rest ya reserva el regreso y la descompresión antes de pensar en extras para después del trabajo.';
    contextMeta = `Salida programada · ${formatDayTime(activeEnd)}`;
  } else if (recoveryPlan) {
    heroTitle = 'Ahora toca bajar revoluciones.';
    contextTitle = 'Recuperación post-turno nocturno';
    contextCopy = 'La noche terminó hace poco. WeekFlow protege la llegada y el descanso antes de volver a llenar el día.';
    contextMeta = `Casa aprox. ${formatHm(recoveryPlan.homeAt)} · descanso desde ${formatHm(recoveryPlan.sleepAt)}`;
  } else if (nextRest) {
    contextTitle = isNightShift(nextRest.shift) ? 'Preparar un turno nocturno' : 'Proteger la próxima mañana';
    contextCopy = isNightShift(nextRest.shift)
      ? 'La hora de descanso se calcula desde tu entrada nocturna; no usamos una hora universal para acostarte.'
      : 'Calculamos hacia atrás desde la próxima entrada para que el turno no se coma tu descanso.';
    contextMeta = `Próxima entrada · ${formatDayTime(nextRest.nextStart)}`;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView contentContainerStyle={styles.content} onRefreshData={refreshRest}>
        <Brand />
        <PillarTabs active="rest" />

        <Text style={styles.eyebrow}>PILARES · REST</Text>
        <Text style={styles.title}>{heroTitle}</Text>
        <Text style={styles.copy}>Rest usa los mismos turnos y tiempos reales que Ahora. Si la semana cambia, la recuperación cambia con ella.</Text>

        <View style={styles.contextCard}>
          <Text style={styles.contextEyebrow}>AHORA</Text>
          <Text style={styles.contextTitle}>{contextTitle}</Text>
          <Text style={styles.contextCopy}>{contextCopy}</Text>
          <Text style={styles.contextMeta}>{contextMeta}</Text>
        </View>

        {activeRecovery && activeEnd ? (
          <>
            <Text style={styles.section}>DESPUÉS DEL TURNO</Text>
            <View style={styles.timelineCard}>
              <RestRow time={formatHm(activeEnd)} icon="✓" title="Salir" copy="La salida real puede corregir esta hora con “Ya salí”." />
              <RestRow time={activeRecovery.commute.time} icon="🚇" title="Llegar a casa" copy={`${dayState.settings.commuteBackMin} min de regreso estimado.`} />
              <RestRow time={activeRecovery.recovery.time} icon="🌿" title="Bajar revoluciones" copy={`${dayState.settings.recoveryMin} min protegidos antes de sumar otra cosa.`} />
              <RestRow time={activeRecovery.rest.time} icon="😴" title="Dormir / recuperar" copy="Después de una noche, Rest gana prioridad sobre lo flexible." last />
            </View>
          </>
        ) : recoveryPlan ? (
          <>
            <Text style={styles.section}>RECUPERACIÓN</Text>
            <View style={styles.timelineCard}>
              <RestRow time={formatHm(recoveryPlan.exitAt)} icon="✓" title="Salida tomada como real" copy="Usamos tu salida registrada cuando está disponible." />
              <RestRow time={formatHm(recoveryPlan.homeAt)} icon="🚇" title="Regreso" copy={`${dayState.settings.commuteBackMin} min estimados.`} />
              <RestRow time={formatHm(recoveryPlan.decompressAt)} icon="🌿" title="Descompresión" copy="Sin tareas obligatorias en este bloque." />
              <RestRow time={formatHm(recoveryPlan.sleepAt)} icon="😴" title="Ventana de descanso" copy="Orientativa: puedes ajustarla a cómo llegues realmente." last />
            </View>
          </>
        ) : nextRest ? (
          <>
            <Text style={styles.section}>PRÓXIMO DESCANSO</Text>
            <View style={styles.planCard}>
              <View style={styles.planMain}>
                <Text style={styles.planLabel}>CIERRE ORIENTATIVO</Text>
                <Text style={styles.planTime}>{formatDayTime(nextRest.windDownAt)}</Text>
                <Text style={styles.planCopy}>Referencia calculada desde la próxima entrada. Dejamos 45 min para bajar el ritmo antes de una ventana base de descanso.</Text>
              </View>
              <View style={styles.planStats}>
                <MiniStat label="Descanso" value={formatHm(nextRest.sleepAt)} />
                <MiniStat label="Despertar" value={formatHm(nextRest.wakeAt)} />
                <MiniStat label="Entrada" value={formatHm(nextRest.nextStart)} />
              </View>
              <Text style={styles.note}>La ventana base se usa para organizar, no como una orden rígida. Más adelante será personalizable.</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.section}>PRÓXIMO DESCANSO</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No hay otro turno registrado todavía.</Text>
              <Text style={styles.emptyCopy}>Rest no inventa una alarma ni una hora de dormir cuando Semana no tiene una próxima entrada.</Text>
            </View>
          </>
        )}

        <Text style={styles.section}>REGLAS ACTIVAS</Text>
        <View style={styles.rulesCard}>
          <Rule title="El turno manda" copy="Entrada, traslado, preparación y margen definen el descanso; no una hora fija universal." />
          <Rule title="La noche cambia la prioridad" copy="Después de un turno nocturno, recuperación aparece antes que Move, pendientes o productividad." />
          <Rule title="La realidad puede corregir el plan" copy="Si marcas “Ya salí”, el Brain reajusta el regreso y la recuperación desde esa hora." last />
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

function RestRow({ time, icon, title, copy, last = false }: { time: string; icon: string; title: string; copy: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowTime}>{time}</Text>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function Rule({ title, copy, last = false }: { title: string; copy: string; last?: boolean }) {
  return (
    <View style={[styles.rule, last && styles.ruleLast]}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 104 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 39, lineHeight: 45, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  contextCard: { marginTop: 24, backgroundColor: '#142A48', borderWidth: 1, borderColor: '#315987', borderRadius: 24, padding: 18 },
  contextEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  contextTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  contextCopy: { color: '#C1CEE0', fontSize: 14, lineHeight: 21, marginTop: 7 },
  contextMeta: { color: '#83B8F4', fontSize: 12, fontWeight: '900', marginTop: 13 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  timelineCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLast: { borderBottomWidth: 0 },
  rowTime: { width: 48, color: '#75ACF4', fontWeight: '900', fontSize: 13 },
  rowIcon: { width: 24, fontSize: 18 },
  rowTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  rowCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  planCard: { backgroundColor: '#101F35', borderWidth: 1, borderColor: '#294D76', borderRadius: 24, padding: 18 },
  planMain: { backgroundColor: '#142B4A', borderRadius: 18, padding: 16 },
  planLabel: { color: '#82B9FB', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  planTime: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 6 },
  planCopy: { color: '#BCCADD', fontSize: 13, lineHeight: 20, marginTop: 7 },
  planStats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  miniStat: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingVertical: 12, alignItems: 'center' },
  miniValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  miniLabel: { color: colors.muted, fontSize: 10, marginTop: 4 },
  note: { color: '#7890AE', fontSize: 11, lineHeight: 17, marginTop: 12 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  rulesCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  rule: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  ruleLast: { borderBottomWidth: 0 },
  ruleTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  ruleCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
