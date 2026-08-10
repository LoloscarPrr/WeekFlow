import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Brand } from '@/src/components/Brand';
import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import type { BrainSnapshot, Energy, Shift, ShiftType } from '@/src/brain/types';
import {
  loadDayState,
  loadWeekState,
  saveDayState,
  saveWeekState,
  shiftForDate,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const energyOptions: { value: Energy; label: string; icon: string }[] = [
  { value: 'vigoroso', label: 'Vigoroso', icon: '🔋' },
  { value: 'bien', label: 'Bien', icon: '🙂' },
  { value: 'cansado', label: 'Cansado', icon: '😮‍💨' },
  { value: 'agotado', label: 'Agotado', icon: '😴' },
];

type TimePickerTarget = { day: number; field: 'start' | 'end'; value: Date };
type DayPhase = 'off' | 'before' | 'commuting' | 'working' | 'after';

function currentHm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

function classifyShift(start: string, end: string): ShiftType {
  if (!start || !end) return 'off';
  const hour = Number(start.split(':')[0]);
  const endHour = Number(end.split(':')[0]);
  if (hour >= 18 || endHour <= 8 || end < start) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'custom';
}

function dateFromTime(value: string, fallback: string) {
  const source = /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const [hours, minutes] = source.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function timeFromDate(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function phaseForShift(shift: Shift, commuteOutMin: number, bufferMin: number): DayPhase {
  if (shift.type === 'off' || !shift.start || !shift.end) return 'off';

  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const overnight = end <= start;
  const working = overnight ? now >= start || now < end : now >= start && now < end;
  if (working) return 'working';

  const untilStart = (start - now + 1440) % 1440;
  const beforeUpcomingShift = untilStart <= 12 * 60;
  if (!beforeUpcomingShift) return 'after';
  if (untilStart <= commuteOutMin + bufferMin) return 'commuting';
  return 'before';
}

function energyLabel(energy: Energy) {
  return energyOptions.find((item) => item.value === energy)?.label ?? 'Bien';
}

export default function NowScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [showWeekEditor, setShowWeekEditor] = useState(false);
  const [timePicker, setTimePicker] = useState<TimePickerTarget | null>(null);

  const todayShift = useMemo(() => shiftForDate(weekState), [weekState]);
  const snapshot = useMemo<BrainSnapshot>(() => ({ ...dayState.settings, shift: todayShift, energy: dayState.energy }), [dayState.energy, dayState.settings, todayShift]);
  const basePlan = useMemo(() => buildBrainPlan(snapshot), [snapshot]);
  const hasActualExit = Boolean(dayState.actualExit && isToday(dayState.actualExitAt));
  const plan = useMemo(() => hasActualExit && dayState.actualExit ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit) : basePlan, [basePlan, dayState.actualExit, hasActualExit, snapshot]);
  const phase = phaseForShift(todayShift, dayState.settings.commuteOutMin, dayState.settings.bufferMin);

  useEffect(() => saveDayState(dayState), [dayState]);
  useEffect(() => saveWeekState(weekState), [weekState]);

  function updateEnergy(energy: Energy) {
    setDayState((current) => ({ ...current, energy }));
  }

  function markActualExit() {
    const now = new Date();
    setDayState((current) => ({ ...current, actualExit: currentHm(), actualExitAt: now.toISOString() }));
  }

  function updateShift(day: number, patch: { start?: string; end?: string; off?: boolean }) {
    setWeekState((current) => ({
      shifts: current.shifts.map((item) => {
        if (item.day !== day) return item;
        if (patch.off === true) return { ...item, start: '', end: '', type: 'off' as ShiftType };
        const start = patch.start !== undefined ? patch.start : item.start;
        const end = patch.end !== undefined ? patch.end : item.end;
        return { ...item, start, end, type: classifyShift(start, end) };
      }),
    }));
    if (day === todayIndex()) setDayState((current) => ({ ...current, actualExit: null, actualExitAt: null }));
  }

  function setWorkDay(day: number) {
    setWeekState((current) => ({
      shifts: current.shifts.map((item) => item.day === day ? { ...item, start: item.start || '09:00', end: item.end || '17:00', type: classifyShift(item.start || '09:00', item.end || '17:00') } : item),
    }));
  }

  function openTimePicker(day: number, field: 'start' | 'end', value: string) {
    setTimePicker({ day, field, value: dateFromTime(value, field === 'start' ? '09:00' : '17:00') });
  }

  function applyPickedTime(selectedDate: Date) {
    if (!timePicker) return;
    const value = timeFromDate(selectedDate);
    updateShift(timePicker.day, timePicker.field === 'start' ? { start: value } : { end: value });
    setTimePicker(null);
  }

  const jornadaLabel = snapshot.shift.type === 'off' ? 'Libre' : `${snapshot.shift.start}–${snapshot.shift.end}`;

  const live = (() => {
    if (hasActualExit) return { title: plan.headline, blue: `${dayState.actualExit} · Salida real`, copy: plan.primary.detail, icon: '✓' };
    if (phase === 'working') return { title: 'Trabajando ahora', blue: `${todayShift.start}–${todayShift.end} · Jornada en curso`, copy: 'Estás dentro de tu horario. WeekFlow no te pide marcar nada mientras trabajas.', icon: '💼' };
    if (phase === 'commuting') return { title: 'En camino al trabajo', blue: `${todayShift.start} · Entrada`, copy: 'Ya estás en la ventana de traslado. Lo importante ahora es llegar con margen.', icon: '🚇' };
    if (phase === 'after') return { title: 'Jornada finalizada', blue: `${todayShift.end} · Salida programada`, copy: 'Si saliste a otra hora, registra la salida real para ajustar solo lo que viene después.', icon: '✓' };
    return { title: plan.headline, blue: `${plan.primary.time} · ${plan.primary.title}`, copy: plan.primary.detail, icon: plan.primary.icon };
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <View style={styles.build}><Text style={styles.buildText}>Alpha 0.2.4</Text></View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AHORA</Text>
          <Text style={styles.title}>Tu día, sin ruido<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>WeekFlow mira tu horario y te muestra solo lo que importa en este momento.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.brainIcon}><Text style={styles.emoji}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>WeekFlow Brain</Text>
              <Text style={styles.muted}>{phase === 'working' ? 'Tu jornada está en curso. El resto del día se mantiene en espera.' : plan.summary}</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={jornadaLabel} label="Hoy" />
            <Stat value={`${snapshot.commuteOutMin}/${snapshot.commuteBackMin}`} label="Ida / vuelta" />
            <Stat value={energyLabel(dayState.energy)} label="Energía" />
          </View>
        </View>

        <Text style={styles.section}>¿CÓMO LLEGAS HOY?</Text>
        <View style={styles.energyGrid}>
          {energyOptions.map((item) => {
            const active = item.value === dayState.energy;
            return (
              <Pressable key={item.value} style={[styles.energyButton, active && styles.energyButtonActive]} onPress={() => updateEnergy(item.value)}>
                <Text style={styles.energyIcon}>{item.icon}</Text>
                <Text style={[styles.energyText, active && styles.energyTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>DÍA VIVO</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveIcon}><Text style={styles.emoji}>{live.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>{live.title}</Text>
              <Text style={styles.liveBlue}>{live.blue}</Text>
            </View>
          </View>
          <Text style={styles.liveCopy}>{live.copy}</Text>

          {phase === 'after' && !hasActualExit ? (
            <Pressable style={styles.exitButton} onPress={markActualExit}>
              <Text style={styles.exitButtonText}>Registrar salida real ahora</Text>
            </Pressable>
          ) : null}

          {hasActualExit ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>Salida real registrada · {dayState.actualExit}</Text>
              <Text style={styles.confirmationMuted}>Solo movimos lo flexible. Tu jornada sigue intacta.</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {plan.moments.slice(0, 7).map((item, index) => (
            <View key={`${item.time}-${item.type}-${index}`} style={[styles.timelineRow, index === Math.min(plan.moments.length, 7) - 1 && styles.timelineRowLast]}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.weekToggle} onPress={() => setShowWeekEditor((value) => !value)}>
          <View>
            <Text style={styles.weekToggleTitle}>Ajustar semana manualmente</Text>
            <Text style={styles.weekToggleCopy}>Solo si necesitas corregir algo a mano.</Text>
          </View>
          <Text style={styles.weekToggleArrow}>{showWeekEditor ? '⌃' : '⌄'}</Text>
        </Pressable>

        {showWeekEditor ? (
          <View style={styles.weekCard}>
            {weekState.shifts.map((shift) => {
              const off = shift.type === 'off';
              return (
                <View key={shift.day} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayName}>{DAYS[shift.day]}</Text>
                      <Text style={styles.dayState}>{off ? 'Libre' : `${shift.start}–${shift.end}`}</Text>
                    </View>
                    <Pressable style={styles.dayToggle} onPress={() => off ? setWorkDay(shift.day) : updateShift(shift.day, { off: true })}>
                      <Text style={styles.dayToggleText}>{off ? 'Agregar' : 'Libre'}</Text>
                    </Pressable>
                  </View>
                  {!off ? (
                    <View style={styles.timeRow}>
                      <Pressable style={styles.timeInput} onPress={() => openTimePicker(shift.day, 'start', shift.start)}><Text style={styles.timeInputText}>Entrada · {shift.start}</Text></Pressable>
                      <Pressable style={styles.timeInput} onPress={() => openTimePicker(shift.day, 'end', shift.end)}><Text style={styles.timeInputText}>Salida · {shift.end}</Text></Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {timePicker ? (
        <DateTimePicker
          value={timePicker.value}
          mode="time"
          presentation="dialog"
          display="clock"
          is24Hour
          accentColor={colors.blue}
          onValueChange={(_, selectedDate) => applyPickedTime(selectedDate)}
          onDismiss={() => setTimePicker(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 56 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  build: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buildText: { color: colors.text, fontSize: 14 },
  hero: { marginTop: 34, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 48, lineHeight: 52, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 26, padding: 18 },
  cardHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  brainIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#2D75D8', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 27 },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.surface2, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 12, minHeight: 86 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 7 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  energyGrid: { flexDirection: 'row', gap: 8 },
  energyButton: { flex: 1, minHeight: 92, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 8 },
  energyButtonActive: { borderColor: colors.blue, backgroundColor: '#12315A' },
  energyIcon: { fontSize: 26 },
  energyText: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 7 },
  energyTextActive: { color: colors.text },
  liveCard: { backgroundColor: '#102A4D', borderRadius: 26, borderWidth: 1, borderColor: '#2A5D99', padding: 18 },
  liveRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  liveIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  liveTitle: { color: colors.text, fontWeight: '900', fontSize: 22, lineHeight: 27 },
  liveBlue: { color: '#5CA0FF', fontWeight: '900', fontSize: 15, marginTop: 5 },
  liveCopy: { color: '#C2D0E3', fontSize: 15, lineHeight: 22, marginTop: 16 },
  exitButton: { marginTop: 16, backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  exitButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  confirmation: { marginTop: 16, backgroundColor: '#0F4039', borderWidth: 1, borderColor: '#2C7569', borderRadius: 18, padding: 14 },
  confirmationText: { color: '#97E7D4', fontWeight: '900', fontSize: 14 },
  confirmationMuted: { color: '#A6C8C0', fontSize: 12, lineHeight: 18, marginTop: 5 },
  timelineCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  timelineRowLast: { borderBottomWidth: 0 },
  timelineTime: { color: '#6EA8FF', fontSize: 13, fontWeight: '900', width: 48 },
  timelineIcon: { fontSize: 18, width: 24 },
  timelineTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  timelineDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  weekToggle: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 16 },
  weekToggleTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  weekToggleCopy: { color: colors.muted, fontSize: 12, marginTop: 4 },
  weekToggleArrow: { color: colors.blue, fontSize: 22 },
  weekCard: { marginTop: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 14 },
  dayRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { color: colors.text, fontWeight: '900', fontSize: 14 },
  dayState: { color: colors.muted, fontSize: 12, marginTop: 3 },
  dayToggle: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  dayToggleText: { color: '#79B6FF', fontSize: 11, fontWeight: '900' },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  timeInput: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 11 },
  timeInputText: { color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
