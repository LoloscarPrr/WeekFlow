import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Brand } from '@/src/components/Brand';
import { buildBrainPlan, replanAfterActualExit } from '@/src/brain/engine';
import type { BrainSnapshot, Energy, ShiftType } from '@/src/brain/types';
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

type TimePickerTarget = {
  day: number;
  field: 'start' | 'end';
  value: Date;
};

function currentHm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isToday(iso: string | null) {
  if (!iso) return false;
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
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

export default function NowScreen() {
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [timePicker, setTimePicker] = useState<TimePickerTarget | null>(null);

  const todayShift = useMemo(() => shiftForDate(weekState), [weekState]);
  const snapshot = useMemo<BrainSnapshot>(
    () => ({ ...dayState.settings, shift: todayShift, energy: dayState.energy }),
    [dayState.energy, dayState.settings, todayShift],
  );

  const basePlan = useMemo(() => buildBrainPlan(snapshot), [snapshot]);
  const hasActualExit = Boolean(dayState.actualExit && isToday(dayState.actualExitAt));
  const plan = useMemo(
    () =>
      hasActualExit && dayState.actualExit
        ? replanAfterActualExit(snapshot, basePlan, dayState.actualExit)
        : basePlan,
    [basePlan, dayState.actualExit, hasActualExit, snapshot],
  );

  useEffect(() => saveDayState(dayState), [dayState]);
  useEffect(() => saveWeekState(weekState), [weekState]);

  function updateEnergy(energy: Energy) {
    setDayState((current) => ({ ...current, energy }));
  }

  function markActualExit() {
    const now = new Date();
    setDayState((current) => ({
      ...current,
      actualExit: currentHm(),
      actualExitAt: now.toISOString(),
    }));
  }

  function updateShift(day: number, patch: { start?: string; end?: string; off?: boolean }) {
    setWeekState((current) => {
      const shifts = current.shifts.map((item) => {
        if (item.day !== day) return item;
        if (patch.off === true) return { ...item, start: '', end: '', type: 'off' as ShiftType };

        const start = patch.start !== undefined ? patch.start : item.start;
        const end = patch.end !== undefined ? patch.end : item.end;
        return { ...item, start, end, type: classifyShift(start, end) };
      });
      return { shifts };
    });

    if (day === todayIndex()) {
      setDayState((current) => ({ ...current, actualExit: null, actualExitAt: null }));
    }
  }

  function setWorkDay(day: number) {
    setWeekState((current) => {
      const shifts = current.shifts.map((item) =>
        item.day === day
          ? {
              ...item,
              start: item.start || '09:00',
              end: item.end || '17:00',
              type: classifyShift(item.start || '09:00', item.end || '17:00'),
            }
          : item,
      );
      return { shifts };
    });
  }

  function openTimePicker(day: number, field: 'start' | 'end', value: string) {
    setTimePicker({
      day,
      field,
      value: dateFromTime(value, field === 'start' ? '09:00' : '17:00'),
    });
  }

  function applyPickedTime(selectedDate: Date) {
    if (!timePicker) return;
    const value = timeFromDate(selectedDate);
    updateShift(
      timePicker.day,
      timePicker.field === 'start' ? { start: value } : { end: value },
    );
    setTimePicker(null);
  }

  const jornadaLabel = snapshot.shift.type === 'off' ? 'Libre' : `${snapshot.shift.start}–${snapshot.shift.end}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <View style={styles.build}>
            <Text style={styles.buildText}>Build 4.8.4</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AHORA</Text>
          <Text style={styles.title}>
            Tu semana{'\n'}fluye contigo<Text style={styles.blue}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Día Vivo nace de tu semana real y se adapta a cada jornada.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.brainIcon}><Text style={styles.emoji}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>WeekFlow Brain</Text>
              <Text style={styles.muted}>{plan.summary}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat value={jornadaLabel} label="Jornada de hoy" />
            <Stat value={`${snapshot.commuteOutMin}/${snapshot.commuteBackMin}`} label="Ida / vuelta" />
            <Stat value={energyLabel(dayState.energy)} label="Energía" />
          </View>
        </View>

        <Text style={styles.section}>¿CÓMO LLEGAS HOY?</Text>
        <View style={styles.energyGrid}>
          {energyOptions.map((item) => {
            const active = item.value === dayState.energy;
            return (
              <Pressable
                key={item.value}
                style={[styles.energyButton, active && styles.energyButtonActive]}
                onPress={() => updateEnergy(item.value)}
              >
                <Text style={styles.energyIcon}>{item.icon}</Text>
                <Text style={[styles.energyText, active && styles.energyTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>DÍA VIVO</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveIcon}><Text style={styles.emoji}>{plan.primary.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>{plan.headline}</Text>
              <Text style={styles.liveBlue}>{plan.primary.time} · {plan.primary.title}</Text>
            </View>
          </View>
          <Text style={styles.liveCopy}>{plan.primary.detail}</Text>

          {snapshot.shift.type !== 'off' && !hasActualExit ? (
            <Pressable style={styles.exitButton} onPress={markActualExit}>
              <Text style={styles.exitButtonText}>✓ Ya salí</Text>
            </Pressable>
          ) : hasActualExit ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>Salida real registrada · {dayState.actualExit}</Text>
              <Text style={styles.confirmationMuted}>Solo movimos lo flexible. Tu jornada y prioridades siguen protegidas.</Text>
            </View>
          ) : (
            <View style={styles.button}>
              <Text style={styles.buttonText}>Día libre · dejamos espacio real</Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>LO QUE VIENE</Text>
        <View style={styles.timelineCard}>
          {plan.moments.map((item, index) => (
            <View
              key={`${item.time}-${item.type}-${index}`}
              style={[styles.timelineRow, index === plan.moments.length - 1 && styles.timelineRowLast]}
            >
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>
                  {item.detail}{item.flexible ? ' · Flexible' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>TU SEMANA</Text>
        <View style={styles.weekCard}>
          <Text style={styles.weekIntro}>Tus jornadas se guardan en SQLite y son la única fuente que usa Día Vivo.</Text>
          {weekState.shifts.map((shift) => {
            const isTodayRow = shift.day === todayIndex();
            const off = shift.type === 'off';
            return (
              <View key={shift.day} style={[styles.dayRow, isTodayRow && styles.dayRowToday]}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayName}>{DAYS[shift.day]}{isTodayRow ? ' · Hoy' : ''}</Text>
                    <Text style={styles.dayState}>{off ? '🌿 Libre' : `💼 ${shift.start || '--:--'}–${shift.end || '--:--'}`}</Text>
                  </View>
                  <Pressable
                    style={[styles.dayToggle, off ? styles.dayToggleOff : styles.dayToggleWork]}
                    onPress={() => off ? setWorkDay(shift.day) : updateShift(shift.day, { off: true })}
                  >
                    <Text style={styles.dayToggleText}>{off ? 'Agregar jornada' : 'Marcar libre'}</Text>
                  </Pressable>
                </View>

                {!off ? (
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>Entrada</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Cambiar entrada del ${DAYS[shift.day]}`}
                        style={styles.timeInput}
                        onPress={() => openTimePicker(shift.day, 'start', shift.start)}
                      >
                        <Text style={styles.timeInputText}>{shift.start || '09:00'}</Text>
                        <Text style={styles.timeInputHint}>Tocar para cambiar</Text>
                      </Pressable>
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>Salida</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Cambiar salida del ${DAYS[shift.day]}`}
                        style={styles.timeInput}
                        onPress={() => openTimePicker(shift.day, 'end', shift.end)}
                      >
                        <Text style={styles.timeInputText}>{shift.end || '17:00'}</Text>
                        <Text style={styles.timeInputHint}>Tocar para cambiar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>UX / Semana v4.8.4</Text>
          <Text style={styles.infoText}>
            • “Jornada” reemplaza “turno” en la interfaz{'\n'}
            • Entrada y Salida usan el selector de hora nativo{'\n'}
            • ya no tienes que borrar ni escribir HH:MM manualmente{'\n'}
            • la splash oficial usa la identidad WeekFlow{'\n'}
            • el modelo interno conserva Shift para no romper datos existentes{'\n'}
            • Core, Día Vivo y “Ya salí” siguen compartiendo la misma semana persistente
          </Text>
        </View>
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

function energyLabel(energy: Energy) {
  return energyOptions.find((item) => item.value === energy)?.label ?? 'Bien';
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
  content: { padding: 22, paddingBottom: 48 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  build: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buildText: { color: colors.text, fontSize: 14 },
  hero: { marginTop: 36, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 50, lineHeight: 54, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 18, marginTop: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 28, padding: 20 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brainIcon: { width: 55, height: 55, borderRadius: 17, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22529A' },
  emoji: { fontSize: 28 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 9, marginTop: 20 },
  stat: { flex: 1, padding: 13, borderRadius: 18, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151' },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 15 },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 13 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 28, marginBottom: 12 },
  energyGrid: { flexDirection: 'row', gap: 8 },
  energyButton: { flex: 1, minHeight: 76, borderRadius: 18, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  energyButtonActive: { backgroundColor: '#102D52', borderColor: colors.blue },
  energyIcon: { fontSize: 23 },
  energyText: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 5 },
  energyTextActive: { color: colors.text },
  liveCard: { backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#1C477F', borderRadius: 28, padding: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  liveIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.blue },
  liveTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  liveBlue: { color: colors.blue, fontWeight: '800', fontSize: 17, marginTop: 3 },
  liveCopy: { color: '#BCCBE0', fontSize: 16, lineHeight: 23, marginTop: 20 },
  button: { backgroundColor: '#17345E', borderWidth: 1, borderColor: '#2C5C9B', borderRadius: 20, padding: 17, alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  exitButton: { backgroundColor: colors.blue, borderRadius: 20, padding: 17, alignItems: 'center', marginTop: 20 },
  exitButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  confirmation: { backgroundColor: '#0D322F', borderWidth: 1, borderColor: '#1E6B61', borderRadius: 20, padding: 16, marginTop: 20 },
  confirmationText: { color: '#8EEBD8', fontWeight: '900', fontSize: 15 },
  confirmationMuted: { color: '#91BEB6', fontSize: 13, lineHeight: 19, marginTop: 5 },
  timelineCard: { backgroundColor: '#09182C', borderWidth: 1, borderColor: '#173151', borderRadius: 26, paddingHorizontal: 18 },
  timelineRow: { flexDirection: 'row', gap: 11, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#132A47' },
  timelineRowLast: { borderBottomWidth: 0 },
  timelineTime: { width: 45, color: '#68C7FF', fontSize: 13, fontWeight: '800', paddingTop: 2 },
  timelineIcon: { width: 25, fontSize: 19 },
  timelineTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  timelineDetail: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  weekCard: { backgroundColor: '#09182C', borderWidth: 1, borderColor: '#173151', borderRadius: 26, padding: 14 },
  weekIntro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  dayRow: { padding: 14, borderRadius: 19, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151', marginTop: 9 },
  dayRowToday: { borderColor: '#2D75D8', backgroundColor: '#0D2340' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  dayName: { color: colors.text, fontWeight: '900', fontSize: 16 },
  dayState: { color: colors.muted, fontSize: 13, marginTop: 4 },
  dayToggle: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 14, borderWidth: 1 },
  dayToggleOff: { backgroundColor: '#102B4E', borderColor: '#245A97' },
  dayToggleWork: { backgroundColor: '#16271F', borderColor: '#315E43' },
  dayToggleText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  timeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  timeField: { flex: 1 },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 5 },
  timeInput: { borderWidth: 1, borderColor: '#234466', backgroundColor: '#071526', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, minHeight: 64, justifyContent: 'center' },
  timeInputText: { color: colors.text, fontSize: 18, fontWeight: '900' },
  timeInputHint: { color: '#66809F', fontSize: 10, fontWeight: '700', marginTop: 3 },
  info: { marginTop: 14, padding: 20, borderRadius: 24, backgroundColor: '#071526', borderWidth: 1, borderColor: '#15304E' },
  infoTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  infoText: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 10 },
});
