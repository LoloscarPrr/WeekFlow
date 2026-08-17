import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImportantMoment, WeekSchedule } from '@/src/domain/entities/Shift';
import { colors } from '@/src/theme/colors';

type Props = {
  week: WeekSchedule;
  workDays: number;
  freeDays: number;
  onSaveMoment: (moment: ImportantMoment) => void;
  onDeleteMoment: (id: string) => void;
  onFinish: () => void;
};

function sourceLabel(source: WeekSchedule['source']) {
  if (source === 'camera') return 'Foto tomada con la cámara';
  if (source === 'library') return 'Imagen elegida de la galería';
  if (source === 'pdf') return 'Documento PDF';
  if (source === 'excel') return 'Planilla Excel';
  if (source === 'legacy') return 'Semana conservada de una versión anterior';
  return 'Ingreso manual';
}

export function WeekRitualCard({ week, workDays, freeDays, onFinish }: Props) {
  const organized = Boolean(week.organizedAt);

  function finish() {
    onFinish();
    Alert.alert(
      'Semana organizada',
      `${workDays} ${workDays === 1 ? 'jornada' : 'jornadas'} y ${freeDays} ${freeDays === 1 ? 'día libre' : 'días libres'}. Tu horario queda como la base real de WeekFlow.`,
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.statusHead}>
        <View style={[styles.statusIcon, organized && styles.statusIconDone]}>
          <Text style={styles.statusIconText}>{organized ? '✓' : '○'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SEMANA · CIERRE</Text>
          <Text style={styles.title}>{organized ? 'Horario confirmado' : 'Confirma tu semana'}</Text>
          <Text style={styles.copy}>
            {organized
              ? 'Tu jornada real queda como la base de Ahora, Move, Food y Rest.'
              : 'Revisa tus jornadas y días libres. Si todo coincide, confirma y sigue.'}
          </Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <Text style={styles.sourceLabel}>ORIGEN</Text>
        <Text style={styles.sourceValue}>{sourceLabel(week.source)}</Text>
      </View>

      <View style={styles.assistantBox}>
        <Text style={styles.assistantEyebrow}>ACTIVIDADES PERSONALES</Text>
        <Text style={styles.assistantTitle}>No hace falta registrarlas aquí.</Text>
        <Text style={styles.assistantCopy}>
          WeekFlow deja de pedirte que clasifiques manualmente actividades importantes o poco importantes. Cuando el Asistente entre en esta etapa, podrás contarle tus compromisos en lenguaje natural y usará la misma verdad del Brain.
        </Text>
      </View>

      {!organized ? (
        <Pressable style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishText}>Confirmar semana</Text>
        </Pressable>
      ) : (
        <Text style={styles.doneCopy}>Si cambias una jornada, WeekFlow volverá a pedirte esta confirmación.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16 },
  statusHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F2816', borderWidth: 1, borderColor: '#80662D' },
  statusIconDone: { backgroundColor: '#113A2C', borderColor: '#36795C' },
  statusIconText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  eyebrow: { color: '#76AFFF', fontWeight: '900', letterSpacing: 1.8, fontSize: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  sourceRow: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sourceLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sourceValue: { color: colors.text, fontSize: 11, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  assistantBox: { marginTop: 14, padding: 14, borderRadius: 17, backgroundColor: '#0B1B31', borderWidth: 1, borderColor: '#28558B' },
  assistantEyebrow: { color: '#76AFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  assistantTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 6 },
  assistantCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  finishButton: { minHeight: 52, marginTop: 16, borderRadius: 16, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  finishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  doneCopy: { color: '#86BBA5', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 15 },
});
