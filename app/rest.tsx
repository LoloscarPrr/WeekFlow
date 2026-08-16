import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { useRestController } from '@/src/presentation/rest/useRestController';
import { colors } from '@/src/theme/colors';

export default function RestScreen() {
  const { view, refreshRest } = useRestController();
  const content = view.content;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RefreshableScrollView contentContainerStyle={styles.content} onRefreshData={refreshRest}>
        <Brand />
        <PillarTabs active="rest" />

        <Text style={styles.eyebrow}>PILARES · REST</Text>
        <Text style={styles.title}>{view.heroTitle}</Text>
        <Text style={styles.copy}>Rest usa las mismas jornadas y tiempos reales que Ahora. Si la semana cambia, la recuperación cambia con ella.</Text>

        <View style={styles.contextCard}>
          <Text style={styles.contextEyebrow}>AHORA</Text>
          <Text style={styles.contextTitle}>{view.contextTitle}</Text>
          <Text style={styles.contextCopy}>{view.contextCopy}</Text>
          <Text style={styles.contextMeta}>{view.contextMeta}</Text>
        </View>

        {content.kind === 'timeline' ? (
          <>
            <Text style={styles.section}>{content.sectionTitle}</Text>
            <View style={styles.timelineCard}>
              {content.rows.map((row, index) => (
                <RestRow
                  key={`${row.time}-${row.title}`}
                  time={row.time}
                  icon={row.icon}
                  title={row.title}
                  copy={row.copy}
                  last={index === content.rows.length - 1}
                />
              ))}
            </View>
          </>
        ) : content.kind === 'plan' ? (
          <>
            <Text style={styles.section}>{content.sectionTitle}</Text>
            <View style={styles.planCard}>
              <View style={styles.planMain}>
                <Text style={styles.planLabel}>CIERRE ORIENTATIVO</Text>
                <Text style={styles.planTime}>{content.plan.windDownAt}</Text>
                <Text style={styles.planCopy}>Referencia calculada desde la próxima entrada. Dejamos 45 min para bajar el ritmo antes de una ventana base de descanso.</Text>
              </View>
              <View style={styles.planStats}>
                <MiniStat label="Descanso" value={content.plan.sleepAt} />
                <MiniStat label="Despertar" value={content.plan.wakeAt} />
                <MiniStat label="Entrada" value={content.plan.nextStart} />
              </View>
              <Text style={styles.note}>La ventana base se usa para organizar, no como una orden rígida. Más adelante será personalizable.</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.section}>{content.sectionTitle}</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No hay otro turno registrado todavía.</Text>
              <Text style={styles.emptyCopy}>Rest no inventa una alarma ni una hora de dormir cuando Semana no tiene una próxima entrada.</Text>
            </View>
          </>
        )}

        <Text style={styles.section}>REGLAS ACTIVAS</Text>
        <View style={styles.rulesCard}>
          <Rule title="El turno manda" copy="Entrada, traslado, preparación y margen definen el descanso; no una hora fija universal." />
          <Rule title="La noche cambia la prioridad" copy="Después de un turno nocturno, recuperación aparece antes que Move, pendientes o productividad." />
          <Rule title="La realidad puede corregir el plan" copy="Si marcas “Ya salí”, el Brain reajusta el regreso y la recuperación desde esa hora." last />
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

function RestRow({ time, icon, title, copy, last = false }: { time: string; icon: string; title: string; copy: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowTime}>{time}</Text>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{copy}</Text>
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function Rule({ title, copy, last = false }: { title: string; copy: string; last?: boolean }) {
  return (
    <View style={[styles.rule, last && styles.ruleLast]}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 104 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 39, lineHeight: 45, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  contextCard: { marginTop: 24, backgroundColor: '#142A48', borderWidth: 1, borderColor: '#315987', borderRadius: 24, padding: 18 },
  contextEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  contextTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  contextCopy: { color: '#C1CEE0', fontSize: 14, lineHeight: 21, marginTop: 7 },
  contextMeta: { color: '#83B8F4', fontSize: 12, fontWeight: '900', marginTop: 13 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  timelineCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLast: { borderBottomWidth: 0 },
  rowTime: { width: 48, color: '#75ACF4', fontWeight: '900', fontSize: 13 },
  rowIcon: { width: 24, fontSize: 18 },
  rowTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  rowCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  planCard: { backgroundColor: '#101F35', borderWidth: 1, borderColor: '#294D76', borderRadius: 24, padding: 18 },
  planMain: { backgroundColor: '#142B4A', borderRadius: 18, padding: 16 },
  planLabel: { color: '#82B9FB', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  planTime: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 6 },
  planCopy: { color: '#BCCADD', fontSize: 13, lineHeight: 20, marginTop: 7 },
  planStats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  miniStat: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingVertical: 12, alignItems: 'center' },
  miniValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  miniLabel: { color: colors.muted, fontSize: 10, marginTop: 4 },
  note: { color: '#7890AE', fontSize: 11, lineHeight: 17, marginTop: 12 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  rulesCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  rule: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  ruleLast: { borderBottomWidth: 0 },
  ruleTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  ruleCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
