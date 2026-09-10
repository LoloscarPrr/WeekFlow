import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

const areas = [
  {
    icon: '😴',
    title: 'Descanso',
    copy: 'Recuperación según tu turno.',
    path: '/rest',
  },
  {
    icon: '🍽️',
    title: 'Alimentación',
    copy: 'Registra comidas y recibe sugerencias.',
    path: '/food',
  },
  {
    icon: '▦',
    title: 'Tu semana',
    copy: 'Jornadas, días libres y eventos.',
    path: '/week',
  },
] as const;

export default function GardenScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>JARDÍN</Text>
        <Text style={styles.title}>Equilibrio sin puntajes.</Text>
        <Text style={styles.intro}>Descanso, alimentación y una semana realista.</Text>

        <Text style={styles.section}>ÁREAS DEL JARDÍN</Text>
        <View style={styles.list}>
          {areas.map((area) => (
            <Pressable key={area.title} style={styles.card} onPress={() => router.push(area.path)}>
              <View style={styles.iconWrap}><Text style={styles.icon}>{area.icon}</Text></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{area.title}</Text>
                <Text style={styles.cardCopy}>{area.copy}</Text>
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
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 24, marginBottom: 12 },
  list: { gap: 10 },
  card: { minHeight: 82, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 25 },
});
