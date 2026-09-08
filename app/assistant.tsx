import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

export default function AssistantScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>ASISTENTE</Text>
        <Text style={styles.title}>Controles claros, sin ruido.</Text>
        <Pressable style={styles.privacyCard} onPress={() => router.push('/privacy')}>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>Privacidad y datos</Text>
            <Text style={styles.privacyBody}>Qué guarda WeekFlow y control de informes de fallos.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 36, marginTop: 6 },
  privacyCard: {
    minHeight: 76,
    marginTop: 24,
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  privacyBody: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 26 },
});
