import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import { loadDayState } from '@/src/state/persistence';
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
  function preview() {
    const day = loadDayState();
    setProposal(proposeWeeklyPlan({
      week,
      habits: loadHabitsState(),
      settings: day.settings,
      energy: day.energy,
      now: new Date(),
    }));
  }
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WEEKFLOW BRAIN · VISTA PREVIA</Text>
      <Text style={styles.title}>Reorganizar tus hábitos</Text>
      <Text style={styles.copy}>Calcula una propuesta con tus hábitos guardados y los turnos de esta semana. No se guarda ningún cambio.</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={preview}>
        <Text style={styles.buttonText}>{proposal ? 'Volver a calcular' : 'Ver propuesta semanal'}</Text>
      </Pressable>
      {proposal ? (
        <View style={styles.result}>
          <Text style={styles.heading}>{proposal.slots.length} sesiones sugeridas · Semana del {label(proposal.weekStart)}</Text>
          {proposal.slots.length === 0 ? <Text style={styles.copy}>No hay sesiones para proponer con los hábitos y espacios disponibles.</Text> : null}
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
          <Text style={styles.foot}>Solo vista previa. Confirmar y guardar la propuesta estará disponible en la siguiente etapa, cuando se verifiquen la persistencia y los recordatorios.</Text>
          <Pressable accessibilityRole="button" style={styles.discard} onPress={() => setProposal(null)}>
            <Text style={styles.discardText}>Descartar propuesta</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
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
