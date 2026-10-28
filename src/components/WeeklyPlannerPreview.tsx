import { useState } from 'react';
import { syncLivePlanReminders } from '@/src/services/notifications';
import { Alert } from 'react-native';
import { confirmWeeklyProposal, loadConfirmedWeeklyPlan } from '@/src/brain/weeklyPlanPersistence';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import { loadDailyEnergy } from '@/src/brain/energyHistory';
import { loadDayState, loadMovePreferences, saveMovePreferences, loadMoveHistory } from '@/src/state/persistence';
import { sanitizeMovePreferences } from '@/src/move/adaptation';
import { loadHabitsState } from '@/src/habits/persistence';
import { proposeWeeklyPlan, type WeeklyProposal } from '@/src/brain/weeklyPlanner';
import { colors } from '@/src/theme/colors';

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
function label(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return days[date.getDay()] + ' ' + day;
}
export function WeeklyPlannerPreview({ week }: { week: WeekSchedule }) {
  const [proposal, setProposal] = useState<WeeklyProposal | null>(null);
  const [weekOffset, setWeekOffset] = useState<0 | 1>(new Date().getDay() === 0 ? 1 : 0);
  const [confirmed, setConfirmed] = useState(() => loadConfirmedWeeklyPlan());
  const [movePreferences, setMovePreferences] = useState(() => loadMovePreferences());

  function configureMove(patch: Partial<typeof movePreferences>) {
    const next = sanitizeMovePreferences({ ...loadMovePreferences(), ...patch });
    saveMovePreferences(next);
    setMovePreferences(next);
    // An edited weekly target invalidates the old preview; confirmed plans
    // remain untouched until the user recalculates and explicitly confirms.
    setProposal(null);
  }
  function confirm() {
    if (!proposal) return;
    const result = confirmWeeklyProposal(proposal);
    if (!result.ok) {
      Alert.alert('Propuesta desactualizada', result.reason || 'Vuelve a calcular la semana.');
      setProposal(null);
      return;
    }
    setConfirmed(result.plan || null);
    setProposal(null);
    void syncLivePlanReminders().catch(error => console.warn('Could not synchronize confirmed habit reminders', error));
    Alert.alert('Semana confirmada', 'Las sesiones quedaron guardadas sin borrar tus hábitos ni el historial.');
  }
  function preview() {
    const day = loadDayState();
    setProposal(proposeWeeklyPlan({
      week,
      habits: loadHabitsState(),
      settings: day.settings,
      energy: day.energy,
      energyByDate: loadDailyEnergy(),
      now: new Date(),
      weekOffset,
      move: { preferences: loadMovePreferences(), history: loadMoveHistory() },
    }));
  }
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEKFLOW BRAIN · VISTA PREVIA</Text>
      <Text style={styles.title}>Planear pilares y hábitos</Text>
      <Text style={styles.copy}>Aquí defines cuántas sesiones de Move quieres esta semana. Brain combinará tu perfil físico, turnos, recuperación y Hábitos. Nada cambia en el calendario sin tu confirmación.</Text>
      <View style={styles.moveSettings}>
        <Text style={styles.heading}>🏃 Move · sesiones por semana</Text>
        <View style={styles.chips}>
          {[0, 1, 2, 3, 4, 5].map(count => (
            <Pressable key={count} accessibilityRole="button"
              accessibilityLabel={count === 0 ? 'No programar Move' : `Programar ${count} sesiones Move por semana`}
              onPress={() => configureMove({ weeklyTargetSessions: count })}
              style={[styles.chip, movePreferences.weeklyTargetSessions === count && styles.chipSelected]}>
              <Text style={[styles.chipText, movePreferences.weeklyTargetSessions === count && styles.chipTextSelected]}>
                {count === 0 ? 'Sin plan' : `${count}/sem`}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.heading}>Duración preferida por sesión</Text>
        <View style={styles.chips}>
          {([30, 45, 60] as const).map(minutes => (
            <Pressable key={minutes} accessibilityRole="button"
              onPress={() => configureMove({ preferredSessionMinutes: minutes })}
              style={[styles.chip, movePreferences.preferredSessionMinutes === minutes && styles.chipSelected]}>
              <Text style={[styles.chipText, movePreferences.preferredSessionMinutes === minutes && styles.chipTextSelected]}>
                {minutes} min
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.copy}>Músculos, material y nivel se ajustan en el pilar Move. Si cambias estos valores, pulsa «Ver propuesta semanal» y confirma la nueva distribución.</Text>
      </View>
      {confirmed ? <Text style={styles.heading}>Plan confirmado: semana del {label(confirmed.weekStart)} · {(confirmed.moveSlots?.length ?? 0)} Move · {confirmed.slots.length} hábitos</Text> : null}
      <View style={styles.weekChoice}>
        <Pressable accessibilityRole="button" style={[styles.choice, weekOffset === 0 && styles.choiceActive]} onPress={() => { setWeekOffset(0); setProposal(null); }}><Text style={styles.choiceText}>Esta semana</Text></Pressable>
        <Pressable accessibilityRole="button" style={[styles.choice, weekOffset === 1 && styles.choiceActive]} onPress={() => { setWeekOffset(1); setProposal(null); }}><Text style={styles.choiceText}>Próxima semana</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" style={styles.button} onPress={preview}>
        <Text style={styles.buttonText}>{proposal ? 'Volver a calcular' : 'Ver propuesta semanal'}</Text>
      </Pressable>
      {proposal ? (
        <View style={styles.result}>
          <Text style={styles.heading}>{proposal.moveSlots.length} Move + {proposal.slots.length} hábitos · Semana del {label(proposal.weekStart)}</Text>
          {proposal.slots.length === 0 && proposal.moveSlots.length === 0
            ? <Text style={styles.copy}>No hay espacios disponibles para Move ni hábitos con este contexto.</Text> : null}
          {proposal.moveSummary ? (
            <Text style={styles.heading}>🏃 Move · {proposal.moveSummary.completed + proposal.moveSummary.scheduled}/{proposal.moveSummary.requested} sesiones semanales cubiertas</Text>
          ) : null}
          {proposal.moveSlots.map(slot => (
            <View key={slot.id} style={styles.slot}>
              <Text style={styles.time}>{label(slot.date)} · {slot.start}–{slot.end} · {slot.durationMin} min</Text>
              <Text style={styles.name}>🏃 Move · {slot.muscles} · {slot.intensity}</Text>
              <Text style={styles.copy}>{slot.sampleExercises.join(' · ')}</Text>
              <Text style={styles.copy}>{slot.explanation}</Text>
            </View>
          ))}
          <Text style={styles.heading}>🌱 Hábitos · {proposal.slots.length} actividades</Text>
          {proposal.slots.map(slot => (
            <View key={slot.id} style={styles.slot}>
              <Text style={styles.time}>{label(slot.date)} · {slot.start}–{slot.end}</Text>
              <Text style={styles.name}>{slot.title}{slot.variant === 'mini' ? ' · mini' : ''}</Text>
              <Text style={styles.copy}>{slot.explanation}</Text>
            </View>
          ))}
          {proposal.shortfalls.map(missing => (
            <Text key={missing.habitId} style={styles.warning}>Pendiente: {missing.title} · {missing.completed + missing.scheduled}/{missing.requested} cubiertas.</Text>
          ))}
          {proposal.warnings.map((warning, index) => (
            <Text key={index} style={styles.warning}>• {warning}</Text>
          ))}
          <Text style={styles.foot}>Revisa toda la propuesta. Confirmar guarda sesiones de Move y Hábitos como plan semanal. No cambia turnos, preferencias Move, sueño, ejercicios realizados ni hábitos originales.</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={confirm}>
            <Text style={styles.buttonText}>Confirmar y guardar semana</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.discard} onPress={() => setProposal(null)}>
            <Text style={styles.discardText}>Descartar propuesta</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  moveSettings: { gap: 10, backgroundColor: colors.surface2, borderRadius: 14, padding: 12, marginVertical: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, minHeight: 42, justifyContent: 'center' },
  chipSelected: { borderColor: colors.blue, backgroundColor: '#173B68' },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  chipTextSelected: { color: colors.text },
  weekChoice: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  choiceActive: { backgroundColor: '#173B68', borderColor: colors.blue },
  choiceText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  card: { marginTop: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 9 },
  eyebrow: { color: '#76AFFF', letterSpacing: 1.3, fontSize: 10, fontWeight: '900' },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  button: { backgroundColor: colors.blue, borderRadius: 14, minHeight: 46, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  result: { gap: 9, marginTop: 10 },
  heading: { color: colors.text, fontSize: 13, fontWeight: '900' },
  slot: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, gap: 3 },
  time: { color: '#76AFFF', fontSize: 12, fontWeight: '900' },
  name: { color: colors.text, fontSize: 14, fontWeight: '800' },
  warning: { color: '#E8BA7B', fontSize: 12, lineHeight: 17 },
  foot: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  discard: { borderRadius: 12, borderWidth: 1, borderColor: colors.line, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  discardText: { color: colors.text, fontWeight: '800' },
});
