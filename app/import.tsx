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
          <Text style={styles.eyebrow}>SEMANA</Text>
          <Text style={styles.title}>Importa tu horario<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>Elige una captura. WeekFlow busca tu fila y te muestra el resultado antes de guardar.</Text>
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
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13 },
  title: { color: colors.text, fontWeight: '900', fontSize: 40, lineHeight: 45, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 520 },
});
