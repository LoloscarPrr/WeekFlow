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

        <Text style={styles.title}>{view.heroTitle}</Text>

        <View style={styles.contextCard}>
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
              </View>

              {content.plan.nap ? (
                <View style={styles.napCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.napLabel}>PAUSA OPCIONAL</Text>
                    <Text style={styles.napTime}>{content.plan.nap.startAt}–{content.plan.nap.endAt}</Text>
                  </View>
                  <Text style={styles.napIcon}>😴</Text>
                </View>
              ) : null}

              <View style={styles.planStats}>
                <MiniStat label="Descanso" value={content.plan.sleepAt} />
                <MiniStat label="Despertar" value={content.plan.wakeAt} />
                <MiniStat label="Entrada" value={content.plan.nextStart} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.section}>{content.sectionTitle}</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No hay otro turno registrado todavía.</Text>
            </View>
          </>
        )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 104 },
  title: { color: colors.text, fontWeight: '900', fontSize: 23, lineHeight: 29, marginTop: 10 },
  contextCard: { marginTop: 9, backgroundColor: '#142A48', borderWidth: 1, borderColor: '#315987', borderRadius: 18, padding: 14 },
  contextEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  contextTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
  contextCopy: { color: '#C1CEE0', fontSize: 13, lineHeight: 19, marginTop: 5 },
  contextMeta: { color: '#83B8F4', fontSize: 12, fontWeight: '900', marginTop: 8 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 2.2, fontSize: 12, marginTop: 18, marginBottom: 8 },
  timelineCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 48, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLast: { borderBottomWidth: 0 },
  rowTime: { width: 48, color: '#75ACF4', fontWeight: '900', fontSize: 13 },
  rowIcon: { width: 24, fontSize: 18 },
  rowTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  rowCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  planCard: { backgroundColor: '#101F35', borderWidth: 1, borderColor: '#294D76', borderRadius: 18, padding: 13 },
  planMain: { backgroundColor: '#142B4A', borderRadius: 14, padding: 12 },
  planLabel: { color: '#82B9FB', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  planTime: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 6 },
  planCopy: { color: '#BCCADD', fontSize: 13, lineHeight: 20, marginTop: 7 },
  napCard: { marginTop: 9, flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#3D638A', backgroundColor: '#132943', padding: 11 },
  napLabel: { color: '#8FC4FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  napTime: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  napCopy: { color: '#B8C8DB', fontSize: 11, lineHeight: 17, marginTop: 5 },
  napIcon: { fontSize: 25 },
  planStats: { flexDirection: 'row', gap: 8, marginTop: 9 },
  miniStat: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingVertical: 9, alignItems: 'center' },
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
