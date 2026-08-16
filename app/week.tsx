import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Brand } from '@/src/components/Brand';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { WeekRitualCard } from '@/src/components/WeekRitualCard';
import { useWeekController } from '@/src/presentation/week/useWeekController';
import { shiftSummaryLabel } from '@/src/domain/services/weekPresentation';
import { colors } from '@/src/theme/colors';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function WeekScreen() {
  const {
    week,
    summary,
    editingDay,
    timePicker,
    refreshWeek,
    toggleEditingDay,
    setWorkDay,
    setFreeDay,
    setBreakMinutes,
    saveImportantMoment,
    deleteImportantMoment,
    finishWeekRitual,
    openTimePicker,
    applyPickedTime,
    closeTimePicker,
  } = useWeekController();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onRefreshData={refreshWeek}
      >
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
                <Pressable style={styles.dayRow} onPress={() => toggleEditingDay(shift.day)}>
                  <View>
                    <Text style={styles.day}>{DAYS[shift.day]}</Text>
                    <Text style={[styles.dayShift, off && styles.dayOff]}>
                      {shiftSummaryLabel(shift)}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
                </Pressable>

                {open ? (
                  <View style={styles.editor}>
                    <View style={styles.segmented}>
                      <Pressable style={[styles.segment, !off && styles.segmentActive]} onPress={() => setWorkDay(shift.day)}>
                        <Text style={[styles.segmentText, !off && styles.segmentTextActive]}>Trabajo</Text>
                      </Pressable>
                      <Pressable style={[styles.segment, off && styles.segmentOffActive]} onPress={() => setFreeDay(shift.day)}>
                        <Text style={[styles.segmentText, off && styles.segmentTextActive]}>Libre</Text>
                      </Pressable>
                    </View>

                    {!off ? (
                      <>
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
                        <View style={styles.breakRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.breakTitle}>Colación</Text>
                            <Text style={styles.breakCopy}>Duración entre 0 y 180 minutos.</Text>
                          </View>
                          <View style={styles.breakInputWrap}>
                            <TextInput
                              value={String(shift.breakMinutes ?? 0)}
                              onChangeText={(value) => {
                                const digits = value.replace(/\D/g, '').slice(0, 3);
                                setBreakMinutes(shift.day, Number(digits || 0));
                              }}
                              keyboardType="number-pad"
                              maxLength={3}
                              selectTextOnFocus
                              style={styles.breakInput}
                            />
                            <Text style={styles.breakUnit}>min</Text>
                          </View>
                        </View>
                      </>
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
          <View>
            <Text style={styles.importText}>Importar o reemplazar horario</Text>
            <Text style={styles.importSub}>Cámara o imagen · siempre con revisión</Text>
          </View>
          <Text style={styles.importArrow}>→</Text>
        </Pressable>

        <WeekRitualCard
          week={week}
          workDays={summary.workDays}
          freeDays={summary.freeDays}
          onSaveMoment={saveImportantMoment}
          onDeleteMoment={deleteImportantMoment}
          onFinish={finishWeekRitual}
        />
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
          onDismiss={closeTimePicker}
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
  breakRow: { marginTop: 10, padding: 12, borderRadius: 15, backgroundColor: '#081628', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  breakCopy: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  breakInputWrap: { minWidth: 94, minHeight: 42, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  breakInput: { minWidth: 44, color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right', paddingVertical: 6 },
  breakUnit: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  freeCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  importLink: { marginTop: 18, minHeight: 66, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18, backgroundColor: '#0D203A', borderWidth: 1, borderColor: '#234A76', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  importText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  importSub: { color: colors.muted, fontSize: 10, marginTop: 4 },
  importArrow: { color: '#78B7FF', fontSize: 20, fontWeight: '900' },
});
