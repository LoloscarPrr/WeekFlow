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
          <Text style={styles.title}>WeekFlow te encuentra en la planilla<Text style={styles.blue}>.</Text></Text>
          <Text style={styles.subtitle}>
            Alpha 0.2.3 lee la captura, busca cómo apareces en el horario y prepara tu semana real. Nada cambia hasta que revises y confirmes.
          </Text>
        </View>

        <ScheduleImportCard />

        <View style={styles.canonical}>
          <Text style={styles.canonicalTitle}>Regla canónica</Text>
          <Text style={styles.canonicalText}>
            Foto/captura → detectar tu nombre/fila → proponer jornadas → revisar → confirmar. Si WeekFlow no está seguro, lo deja pendiente; nunca inventa ni guarda por su cuenta.
          </Text>
        </View>
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
  hero: { marginTop: 38, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13 },
  title: { color: colors.text, fontWeight: '900', fontSize: 40, lineHeight: 45, marginTop: 11 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 14 },
  canonical: { marginTop: 16, padding: 17, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  canonicalTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  canonicalText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
});
