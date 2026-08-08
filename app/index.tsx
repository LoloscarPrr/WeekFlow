import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

export default function NowScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <View style={styles.build}>
            <Text style={styles.buildText}>Build 4.8.0</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AHORA</Text>
          <Text style={styles.title}>
            Tu semana{'\n'}fluye contigo<Text style={styles.blue}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Nueva base nativa. Mismo WeekFlow.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.brainIcon}><Text style={styles.emoji}>🧠</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>WeekFlow Brain</Text>
              <Text style={styles.muted}>La base nativa está lista para recibir el Brain real.</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat value="12:30–21:30" label="Turno" />
            <Stat value="75 min" label="Traslado" />
            <Stat value="Bien" label="Energía" />
          </View>
        </View>

        <Text style={styles.section}>DÍA VIVO</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveIcon}><Text style={styles.emoji}>🚀</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveTitle}>Nueva base funcionando</Text>
              <Text style={styles.liveBlue}>React Native + Expo</Text>
            </View>
          </View>
          <Text style={styles.liveCopy}>
            v4.8.0 confirma que WeekFlow ya puede vivir como una app nativa real, separada del workflow gigante.
          </Text>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Base nativa lista ✓</Text>
          </Pressable>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Qué cambia desde aquí</Text>
          <Text style={styles.infoText}>
            • app/ contiene las pantallas{'\n'}
            • src/ contiene Brain, componentes y datos{'\n'}
            • GitHub Actions solo compila{'\n'}
            • v4.8.1 moverá el Brain real
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 48 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  build: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  buildText: { color: colors.text, fontSize: 14 },
  hero: { marginTop: 36, marginBottom: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14 },
  title: { color: colors.text, fontWeight: '900', fontSize: 50, lineHeight: 54, marginTop: 10 },
  blue: { color: colors.blue },
  subtitle: { color: colors.muted, fontSize: 18, marginTop: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 28, padding: 20 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brainIcon: { width: 55, height: 55, borderRadius: 17, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22529A' },
  emoji: { fontSize: 28 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 9, marginTop: 20 },
  stat: { flex: 1, padding: 13, borderRadius: 18, backgroundColor: '#0C1B32', borderWidth: 1, borderColor: '#173151' },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 15 },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 13 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 28, marginBottom: 12 },
  liveCard: { backgroundColor: '#0E2240', borderWidth: 1, borderColor: '#1C477F', borderRadius: 28, padding: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  liveIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.blue },
  liveTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  liveBlue: { color: colors.blue, fontWeight: '800', fontSize: 17, marginTop: 3 },
  liveCopy: { color: '#BCCBE0', fontSize: 16, lineHeight: 23, marginTop: 20 },
  button: { backgroundColor: '#17345E', borderWidth: 1, borderColor: '#2C5C9B', borderRadius: 20, padding: 17, alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
  info: { marginTop: 14, padding: 20, borderRadius: 24, backgroundColor: '#071526', borderWidth: 1, borderColor: '#15304E' },
  infoTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  infoText: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 10 },
});
