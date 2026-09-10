import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

const controls = [
  {
    icon: '🔒',
    title: 'Privacidad y datos',
    body: 'Datos locales e informes de fallos.',
    path: '/privacy',
  },
  {
    icon: '▦',
    title: 'Horario semanal',
    body: 'Jornadas, días libres y eventos.',
    path: '/week',
  },
  {
    icon: '↥',
    title: 'Importar horario',
    body: 'Imagen, PDF o archivo compatible.',
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 140 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  list: { gap: 10, marginTop: 20 },
  card: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 26 },
});
