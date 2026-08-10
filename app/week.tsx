import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { loadWeekState } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function WeekScreen() {
  const week = loadWeekState();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>SEMANA</Text>
        <Text style={styles.title}>Tu semana real.</Text>
        <Text style={styles.subtitle}>Jornadas, importación y revisión viven aquí. Día Vivo usa esta misma semana como fuente de verdad.</Text>

        <Pressable style={styles.importCard} onPress={() => router.push('/import')}>
          <View style={styles.iconBox}><Text style={styles.icon}>▣</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.importTitle}>Importar horario</Text>
            <Text style={styles.importCopy}>Foto o captura → detectar tu fila → revisar → confirmar.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.section}>JORNADAS ACTUALES</Text>
        <View style={styles.weekCard}>
          {week.shifts.map((shift) => (
            <View key={shift.day} style={styles.row}>
              <Text style={styles.day}>{DAYS[shift.day]}</Text>
              <Text style={[styles.shift, shift.type === 'off' && styles.off]}>
                {shift.type === 'off' ? 'Libre' : `${shift.start}–${shift.end}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Regla canónica</Text>
          <Text style={styles.noteText}>Una importación nunca reemplaza esta semana hasta que la revises y pulses Confirmar semana.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 36 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30 },
  title: { color: colors.text, fontWeight: '900', fontSize: 42, lineHeight: 48, marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 12 },
  importCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#1C477F', borderRadius: 24, padding: 18, marginTop: 24 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#102D52', borderWidth: 1, borderColor: colors.blue },
  icon: { color: '#75C7FF', fontSize: 24, fontWeight: '900' },
  importTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  importCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  arrow: { color: colors.blue, fontSize: 32, fontWeight: '500' },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  weekCard: { backgroundColor: '#09182C', borderWidth: 1, borderColor: '#173151', borderRadius: 24, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#132A47' },
  day: { color: colors.text, fontSize: 15, fontWeight: '800' },
  shift: { color: '#75C7FF', fontSize: 15, fontWeight: '900' },
  off: { color: '#7EC9A1' },
  note: { marginTop: 20, backgroundColor: '#0D261D', borderWidth: 1, borderColor: '#28583D', borderRadius: 22, padding: 18 },
  noteTitle: { color: '#8BE0A8', fontWeight: '900', fontSize: 16 },
  noteText: { color: '#A9C7B4', fontSize: 14, lineHeight: 21, marginTop: 6 },
});
