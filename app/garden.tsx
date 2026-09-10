import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

const areas = [
  {
    icon: '😴',
    title: 'Descanso',
    copy: 'Revisa cómo proteger recuperación según tu turno.',
    action: 'Abrir Rest',
    path: '/rest',
  },
  {
    icon: '🍽️',
    title: 'Alimentación',
    copy: 'Registra lo que comiste y recibe sugerencias simples según tu día.',
    action: 'Abrir Food',
    path: '/food',
  },
  {
    icon: '▦',
    title: 'Tu semana',
    copy: 'Ajusta jornadas, días libres y momentos importantes sin llenar la pantalla.',
    action: 'Abrir Semana',
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
        <Text style={styles.intro}>
          Jardín no te pone metas por cumplir. Reúne las áreas que WeekFlow ya puede cuidar contigo.
        </Text>

        <View style={styles.focusCard}>
          <Text style={styles.focusEyebrow}>HOY</Text>
          <Text style={styles.focusTitle}>Cuida lo que realmente sostiene tu día.</Text>
          <Text style={styles.focusCopy}>
            Descanso, comida y una semana realista pesan más que llenar casillas.
          </Text>
        </View>

        <Text style={styles.section}>ÁREAS DEL JARDÍN</Text>
        <View style={styles.list}>
          {areas.map((area) => (
            <Pressable key={area.title} style={styles.card} onPress={() => router.push(area.path)}>
              <View style={styles.iconWrap}><Text style={styles.icon}>{area.icon}</Text></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{area.title}</Text>
                <Text style={styles.cardCopy}>{area.copy}</Text>
                <Text style={styles.cardAction}>{area.action}</Text>
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
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  focusCard: { marginTop: 20, backgroundColor: '#12304E', borderWidth: 1, borderColor: '#29577D', borderRadius: 24, padding: 18 },
  focusEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  focusTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  focusCopy: { color: '#B8C9DE', fontSize: 13, lineHeight: 20, marginTop: 6 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 13, marginTop: 28, marginBottom: 12 },
  list: { gap: 10 },
  card: { minHeight: 92, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  cardAction: { color: '#76AFFF', fontSize: 11, fontWeight: '900', marginTop: 6 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 25 },
});
