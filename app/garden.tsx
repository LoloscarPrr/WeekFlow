import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import { useGardenController } from '@/src/presentation/garden/useGardenController';
import { colors } from '@/src/theme/colors';

const signalStyle = {
  recent: { label: 'SEÑAL RECIENTE', background: '#123C2D', border: '#2F8A61', text: '#8EE0B6' },
  connected: { label: 'CONECTADO', background: '#102B4E', border: '#315F96', text: '#9BC8FF' },
  waiting: { label: 'POR CONECTAR', background: '#241E32', border: '#55466E', text: '#B7A7D2' },
} as const;

export default function GardenScreen() {
  const { view } = useGardenController();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.eyebrow}>JARDÍN</Text>
        <Text style={styles.title}>{view.title}</Text>
        <Text style={styles.copy}>{view.copy}</Text>

        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: '#2F8A61' }]} />
          <Text style={styles.legendText}>señal reciente</Text>
          <View style={[styles.legendDot, { backgroundColor: '#315F96' }]} />
          <Text style={styles.legendText}>conectado</Text>
          <View style={[styles.legendDot, { backgroundColor: '#55466E' }]} />
          <Text style={styles.legendText}>por conectar</Text>
        </View>

        <View style={styles.grid}>
          {view.plots.map((plot) => {
            const signal = signalStyle[plot.signal];
            return (
              <View key={plot.id} style={styles.plot}>
                <View style={styles.plotHeader}>
                  <View style={styles.iconWrap}>
                    <Text style={styles.icon}>{plot.icon}</Text>
                  </View>
                  <View style={[styles.signal, { backgroundColor: signal.background, borderColor: signal.border }]}>
                    <Text style={[styles.signalText, { color: signal.text }]}>{signal.label}</Text>
                  </View>
                </View>

                <Text style={styles.plotTitle}>{plot.title}</Text>
                <Text style={styles.plotLabel}>{plot.label}</Text>
                <Text style={styles.plotCopy}>{plot.copy}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Esto no es un marcador.</Text>
          <Text style={styles.noteCopy}>
            Que algo esté “por conectar” solo significa que WeekFlow todavía no tiene una fuente real para leerlo. No es deuda, culpa ni una tarea pendiente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 130 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30 },
  title: { color: colors.text, fontWeight: '900', fontSize: 38, lineHeight: 44, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 22 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 3 },
  legendText: { color: '#8594AC', fontSize: 11, fontWeight: '700', marginRight: 6 },
  grid: { gap: 12, marginTop: 20 },
  plot: { backgroundColor: '#071126', borderRadius: 22, borderWidth: 1, borderColor: '#152B4B', padding: 17 },
  plotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1A33' },
  icon: { fontSize: 21 },
  signal: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  signalText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  plotTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 14 },
  plotLabel: { color: '#7FB6FA', fontSize: 12, fontWeight: '800', marginTop: 5 },
  plotCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  note: { marginTop: 18, borderRadius: 20, padding: 17, backgroundColor: '#0B1223', borderWidth: 1, borderColor: '#222D43' },
  noteTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  noteCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
});
