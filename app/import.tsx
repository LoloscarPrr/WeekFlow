import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/src/components/Brand';
import { ScheduleImportCard } from '@/src/components/ScheduleImportCard';
import { colors } from '@/src/theme/colors';

export default function ImportScheduleScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SEMANA · IMPORTAR</Text>
          <Text style={styles.title}>Tu horario, sin copiarlo a mano<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>Toma una foto o elige una captura. WeekFlow busca tu fila, extrae los turnos y te obliga a revisarlos antes de guardar.</Text>
        </View>

        <ScheduleImportCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 48 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  back: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  backText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  hero: { marginTop: 34, marginBottom: 22 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 2.5, fontSize: 12 },
  title: { color: colors.text, fontWeight: '900', fontSize: 39, lineHeight: 44, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 520 },
});
