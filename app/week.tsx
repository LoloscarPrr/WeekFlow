import { KeyboardAwareTextInput as TextInput } from '@/src/components/KeyboardAwareScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Brand } from '@/src/components/Brand';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { ImportantEventCard } from '@/src/components/ImportantEventCard';
import { WeeklyPlannerPreview } from '@/src/components/WeeklyPlannerPreview';
import { useWeekController } from '@/src/presentation/week/useWeekController';
import { shiftSummaryLabel } from '@/src/domain/services/weekPresentation';
import { colors } from '@/src/theme/colors';
import { shortLocalDateLabel } from '@/src/domain/services/calendarDate';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function weekRange(mondayKey: string): string {
  const parts = mondayKey.split('-').map(Number);
  const sunday = new Date(parts[0], parts[1] - 1, parts[2] + 6, 12);
  const end = String(sunday.getFullYear()) + '-' + String(sunday.getMonth() + 1).padStart(2, '0') + '-' + String(sunday.getDate()).padStart(2, '0');
  return shortLocalDateLabel(mondayKey) + ' — ' + shortLocalDateLabel(end);
}


export default function WeekScreen() {
  const {
    week,
    currentWeek,
    selectedWeek,
    selectedMonday,
    nextPrepared,
    selectWeek,
    copyCurrentToNext,
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
    completeRitual,
    openTimePicker,
    applyPickedTime,
    closeTimePicker,
  } = useWeekController();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <RefreshableScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefreshData={refreshWeek}
        >
          <Brand />

          <View style={styles.hero}>
            <Text style={styles.title}>Semana</Text>
            <Text style={styles.weekRange}>{weekRange(selectedMonday)}</Text>
          </View>

          <View style={styles.weekTabs}>
            {([0, 1] as const).map((offset) => (
              <Pressable
                key={offset}
                accessibilityRole="button"
                accessibilityLabel={offset === 0 ? 'Editar horario de esta semana' : 'Editar horario de la próxima semana'}
                style={[styles.weekTab, selectedWeek === offset && styles.weekTabActive]}
                onPress={() => selectWeek(offset)}
              >
                <Text style={[styles.weekTabText, selectedWeek === offset && styles.weekTabTextActive]}>
                  {offset === 0 ? 'Esta semana' : 'Próxima semana'}
                </Text>
              </Pressable>
            ))}
          </View>
          {selectedWeek === 1 && !nextPrepared ? (
            <Text style={styles.nextHint}>Próxima semana sin horario. Copia la actual o edita los días.</Text>
          ) : null}
          {selectedWeek === 1 ? (
            <Pressable accessibilityRole="button" style={styles.copyWeekButton} onPress={() => {
              if (!nextPrepared) { copyCurrentToNext(); return; }
              Alert.alert(
                '¿Reemplazar la próxima semana?',
                'Esto copiará los siete turnos actuales y reemplazará el horario próximo que ya preparaste.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Copiar y reemplazar', style: 'destructive', onPress: copyCurrentToNext },
                ],
              );
            }}>
              <Text style={styles.copyWeekText}>Copiar horario de esta semana</Text>
            </Pressable>
          ) : null}

          <Text style={styles.summaryLine}>{summary.workDays} jornadas · {summary.freeDays} libres · {summary.total} programadas</Text>

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
                            </View>
                            <View style={styles.breakInputWrap}>
                              <TextInput
                                accessibilityLabel="Duración de colación, entre 0 y 180 minutos"
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
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {selectedWeek === 0 ? (
            <ImportantEventCard
              moments={currentWeek.importantMoments}
              onSave={saveImportantMoment}
              onDelete={deleteImportantMoment}
            />
          ) : (
            <Text style={styles.nextHint}>Los eventos con fecha se conservan entre semanas y se editan desde «Esta semana».</Text>
          )}

          <WeeklyPlannerPreview week={currentWeek} selectedWeek={selectedWeek} />

          <View style={[styles.ritualCard, week.organizedAt ? styles.ritualCardDone : null]}>
            <Text style={[styles.ritualEyebrow, week.organizedAt ? styles.ritualEyebrowDone : null]}>
              {week.organizedAt ? 'SEMANA ORGANIZADA' : 'RITUAL DE LA SEMANA'}
            </Text>
            {!week.organizedAt ? (
              <Pressable style={styles.ritualButton} onPress={completeRitual}>
                <Text style={styles.ritualButtonText}>Listo, organizar semana</Text>
              </Pressable>
            ) : null}
          </View>
        </RefreshableScrollView>
      </KeyboardAvoidingView>

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
  keyboardShell: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 104 },
  hero: { marginTop: 4, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { color: colors.text, fontWeight: '900', fontSize: 24, lineHeight: 29 },
  weekTabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  weekTab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  weekTabActive: { backgroundColor: '#173B68', borderColor: colors.blue },
  weekTabText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  weekTabTextActive: { color: colors.text },
  weekRange: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  summaryLine: { color: '#A8BED7', fontSize: 12, lineHeight: 17, marginBottom: 10, fontWeight: '800' },
  nextHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  copyWeekButton: { padding: 12, borderRadius: 12, borderColor: colors.line, backgroundColor: colors.surface2, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  copyWeekText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  daysCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, overflow: 'hidden' },
  dayBlock: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dayBlockLast: { borderBottomWidth: 0 },
  dayRow: { minHeight: 54, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: { color: colors.text, fontSize: 15, fontWeight: '900' },
  dayShift: { color: '#71BFFF', fontSize: 12, fontWeight: '800', marginTop: 2 },
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
  timeButton: { flex: 1, minHeight: 54, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 10 },
  timeLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  timeValue: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  timeArrow: { color: colors.blue, fontSize: 20, fontWeight: '900' },
  breakRow: { marginTop: 8, padding: 9, borderRadius: 13, backgroundColor: '#081628', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  breakInputWrap: { minWidth: 94, minHeight: 42, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  breakInput: { minWidth: 44, color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right', paddingVertical: 6 },
  breakUnit: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  freeCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  ritualCard: { marginTop: 12, padding: 15, borderRadius: 18, backgroundColor: '#0B1E35', borderWidth: 1, borderColor: '#28558B' },
  ritualCardDone: { backgroundColor: '#0D251E', borderColor: '#2C6F55' },
  ritualEyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 1.8, fontSize: 9 },
  ritualEyebrowDone: { color: '#8EE5B2' },
  ritualTitle: { color: colors.text, fontWeight: '900', fontSize: 16, marginTop: 6 },
  ritualSummary: { color: colors.text, fontWeight: '800', fontSize: 12, marginTop: 6 },
  ritualHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  ritualButton: { marginTop: 12, minHeight: 48, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  ritualButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
});
