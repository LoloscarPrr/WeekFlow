import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { useAssistantController } from '@/src/presentation/assistant/useAssistantController';
import { colors } from '@/src/theme/colors';

const controls = [
  {
    icon: '◉',
    title: 'Cuenta WeekFlow',
    body: 'Identidad, acceso y recuperación.',
    path: '/account',
  },
  {
    icon: '🔔',
    title: 'Notificaciones',
    body: 'Elige qué momentos pueden avisarte.',
    path: '/notifications',
  },
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
  const { context } = useAssistantController();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand />
        <Text style={styles.eyebrow}>ASISTENTE</Text>
        <Text style={styles.title}>Entiendo tu semana real.</Text>
        <Text style={styles.subtitle}>
          Este contexto viene de Ahora, Semana, Move, Food y Rest. No es una copia aparte.
        </Text>

        <Text style={styles.section}>ESTADO REAL</Text>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>AHORA</Text>
          <Text style={styles.heroTitle}>{context.liveTitle}</Text>
          <Text style={styles.heroMeta}>{context.liveMeta}</Text>
        </View>

        <View style={styles.contextGrid}>
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>ENERGÍA</Text>
            <Text style={styles.contextValue}>{context.energyLabel}</Text>
            <Text style={styles.contextMeta}>Jornada · {context.jornadaLabel}</Text>
          </View>
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>MOVE</Text>
            <Text style={styles.contextValue}>{context.move.label}</Text>
            <Text style={styles.contextMeta}>Estado de hoy</Text>
          </View>
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>FOOD</Text>
            <Text style={styles.contextValue}>{context.food.label}</Text>
            <Text style={styles.contextMeta}>
              {context.food.lastTitle ? `Último · ${context.food.lastTitle}` : 'Nada que resumir todavía'}
            </Text>
          </View>
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>REST</Text>
            <Text style={styles.contextValue}>{context.rest.title}</Text>
            <Text style={styles.contextMeta}>{context.rest.meta}</Text>
          </View>
        </View>

        <Text style={styles.section}>CONTROLES</Text>
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
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 24, marginBottom: 10 },
  heroCard: { backgroundColor: '#102A4D', borderWidth: 1, borderColor: '#2A5D99', borderRadius: 22, padding: 16 },
  heroLabel: { color: '#8BBEFF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  heroTitle: { color: colors.text, fontWeight: '900', fontSize: 19, lineHeight: 24, marginTop: 5 },
  heroMeta: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  contextGrid: { gap: 10, marginTop: 10 },
  contextCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  contextLabel: { color: '#76AFFF', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  contextValue: { color: colors.text, fontWeight: '900', fontSize: 15, lineHeight: 20, marginTop: 4 },
  contextMeta: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  list: { gap: 10 },
  card: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  copy: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  arrow: { color: colors.blue, fontWeight: '900', fontSize: 26 },
});
