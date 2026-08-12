import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Brand } from '@/src/components/Brand';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { loadWeekState, saveWeekState, type PersistedWeekState } from '@/src/state/persistence';
import type { ShiftType } from '@/src/brain/types';
import { colors } from '@/src/theme/colors';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type TimePickerTarget = { day: number; field: 'start' | 'end'; value: Date };

function classifyShift(start: string, end: string): ShiftType {
  if (!start || !end) return 'off';
  const startHour = Number(start.split(':')[0]);
  const endHour = Number(end.split(':')[0]);
  if (endHour < startHour || startHour >= 19) return 'night';
  if (startHour < 11) return 'morning';
  if (startHour >= 12 && startHour < 19) return 'afternoon';
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

function durationMinutes(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let result = eh * 60 + em - (sh * 60 + sm);
  if (result < 0) result += 1440;
  return result;
}

export default function WeekScreen() {
  const [week, setWeek] = useState<PersistedWeekState>(() => loadWeekState());
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [timePicker, setTimePicker] = useState<TimePickerTarget | null>(null);

  const summary = useMemo(() => {
    const working = week.shifts.filter((shift) => shift.type !== 'off');
    const totalMinutes = working.reduce((sum, shift) => sum + durationMinutes(shift.start, shift.end), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      workDays: working.length,
      freeDays: 7 - working.length,
      total: `${hours}${minutes ? ` h ${minutes} min` : ' h'}`,
    };
  }, [week]);

  function commit(next: PersistedWeekState) {
    setWeek(next);
    saveWeekState(next);
  }

  function updateShift(day: number, patch: { start?: string; end?: string; off?: boolean }) {
    const next: PersistedWeekState = {
      shifts: week.shifts.map((item) => {
        if (item.day !== day) return item;
        if (patch.off) return { ...item, start: '', end: '', type: 'off' as ShiftType };
        const start = patch.start !== undefined ? patch.start : item.start;
        const end = patch.end !== undefined ? patch.end : item.end;
        return { ...item, start, end, type: classifyShift(start, end) };
      }),
    };
    commit(next);
  }

  function setWorkDay(day: number) {
    const next: PersistedWeekState = {
      shifts: week.shifts.map((item) => item.day === day
        ? { ...item, start: item.start || '09:00', end: item.end || '17:00', type: classifyShift(item.start || '09:00', item.end || '17:00') }
        : item),
    };
    commit(next);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView contentContainerStyle={styles.content}>
        <Brand />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SEMANA</Text>
          <Text style={styles.title}>Tu semana<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>Toca un día para cambiarlo. Nada más.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.workDays}</Text><Text style={styles.summaryLabel}>Jornadas</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.freeDays}</Text><Text style={styles.summaryLabel}>Libres</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{summary.total}</Text><Text style={styles.summaryLabel}>Programadas</Text></View>
        </View>

        <View style={styles.daysCard}>
          {week.shifts.map((shift, index) => {
            const off = shift.type === 'off';
            const open = editingDay === shift.day;
            return (
              <View key={shift.day} style={[styles.dayBlock, index === 6 && styles.dayBlockLast]}>
                <Pressable style={styles.dayRow} onPress={() => setEditingDay(open ? null : shift.day)}>
                  <View>
                    <Text style={styles.day}>{DAYS[shift.day]}</Text>
                    <Text style={[styles.dayShift, off && styles.dayOff]}>{off ? 'Libre' : `${shift.start}–${shift.end}`}</Text>
                  </View>
                  <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
                </Pressable>

                {open ? (
                  <View style={styles.editor}>
                    <View style={styles.segmented}>
                      <Pressable style={[styles.segment, !off && styles.segmentActive]} onPress={() => setWorkDay(shift.day)}>
                        <Text style={[styles.segmentText, !off && styles.segmentTextActive]}>Trabajo</Text>
                      </Pressable>
                      <Pressable style={[styles.segment, off && styles.segmentOffActive]} onPress={() => updateShift(shift.day, { off: true })}>
                        <Text style={[styles.segmentText, off && styles.segmentTextActive]}>Libre</Text>
                      </Pressable>
                    </View>

                    {!off ? (
                      <View style={styles.times}>
                        <Pressable style={styles.timeButton} onPress={() => openTimePicker(shift.day, 'start', shift.start)}>
                          <Text style={styles.timeLabel}>Entrada</Text>
                          <Text style={styles.timeValue}>{shift.start}</Text>
                        </Pressable>
                        <Text style={styles.timeArrow}>→</Text>
                        <Pressable style={styles.timeButton} onPress={() => openTimePicker(shift.day, 'end', shift.end)}>
                          <Text style={styles.timeLabel}>Salida</Text>
                          <Text style={styles.timeValue}>{shift.end}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.freeCopy}>Día libre. WeekFlow no programará una jornada aquí.</Text>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable style={styles.importLink} onPress={() => router.push('/import')}>
          <Text style={styles.importText}>Importar desde una captura</Text>
          <Text style={styles.experimental}>Experimental</Text>
        </Pressable>
      </RefreshableScrollView>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 96 },
  hero: { marginTop: 28, marginBottom: 20 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 44, lineHeight: 49, marginTop: 9 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 8, marginBottom: 18 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.text, fontWeight: '900', fontSize: 18 },
  summaryLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  summaryDivider: { width: 1, height: 34, backgroundColor: colors.line },
  daysCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, overflow: 'hidden' },
  dayBlock: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dayBlockLast: { borderBottomWidth: 0 },
  dayRow: { minHeight: 72, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: { color: colors.text, fontSize: 16, fontWeight: '900' },
  dayShift: { color: '#71BFFF', fontSize: 14, fontWeight: '800', marginTop: 4 },
  dayOff: { color: '#7EDAA3' },
  chevron: { color: colors.muted, fontSize: 24, transform: [{ rotate: '0deg' }] },
  chevronOpen: { transform: [{ rotate: '180deg' }], color: colors.blue },
  editor: { paddingHorizontal: 16, paddingBottom: 16 },
  segmented: { flexDirection: 'row', backgroundColor: '#07111F', borderRadius: 15, padding: 4, borderWidth: 1, borderColor: colors.line },
  segment: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#163B68' },
  segmentOffActive: { backgroundColor: '#174431' },
  segmentText: { color: colors.muted, fontWeight: '800', fontSize: 14 },
  segmentTextActive: { color: colors.text },
  times: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  timeButton: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 13 },
  timeLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  timeValue: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  timeArrow: { color: colors.blue, fontSize: 20, fontWeight: '900' },
  freeCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  importLink: { marginTop: 18, minHeight: 52, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  importText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  experimental: { color: '#70829C', fontSize: 11, fontWeight: '700' },
});