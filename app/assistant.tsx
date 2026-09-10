import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

const controls = [
  {
    icon: '🔒',
    title: 'Privacidad y datos',
    body: 'Qué guarda WeekFlow y control de informes de fallos.',
    path: '/privacy',
  },
  {
    icon: '▦',
    title: 'Horario semanal',
    body: 'Edita jornadas, días libres y momentos importantes.',
    path: '/week',
  },
  {
    icon: '↥',
    title: 'Importar horario',
    body: 'Usa una imagen, PDF o archivo compatible para reconstruir tu semana.',
    path: '/import',
  },
] as const;

export default function AssistantScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>ASISTENTE</Text>
        <Text style={styles.title}>Controles claros, sin ruido.</Text>
        <Text style={styles.intro}>
          Solo aparecen controles que ya hacen algo. Nada de botones de adorno ni ajustes que todavía no existen.
        </Text>

        <View style={styles.list}>
          {controls.map((item) => (
            <Pressable key={item.title} style={styles.card} onPress={() => router.push(item.path)}>
              <View style={styles.iconWrap}><Text style={styles.icon}>{item.icon}</Text></View>
              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteEyebrow}>EN DESARROLLO</Text>
          <Text style={styles.noteTitle}>Más controles llegarán cuando la función exista.</Text>
          <Text style={styles.noteBody}>
            Personalización, respaldos y otros ajustes se añadirán aquí solo después de tener una implementación real detrás.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 140 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  list: { gap: 10, marginTop: 24 },
  card: { minHeight: 82, paddingHorizontal: 15, paddingVertical: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 26 },
  noteCard: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#0B1A2C', borderWidth: 1, borderColor: colors.line },
  noteEyebrow: { color: '#76AFFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.7 },
  noteTitle: { color: colors.text, fontWeight: '900', fontSize: 14, marginTop: 6 },
  noteBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
