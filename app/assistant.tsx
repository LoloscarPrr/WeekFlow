import { router } from 'expo-router';
import { useState } from 'react';
import { brainCloudConfigured, talkToBrainAI } from '@/src/assistant/cloudGateway';
import { brainSuggestionLabel, brainSuggestionToLocalCommand, type BrainChatSuggestion, type BrainChatTurn } from '@/src/assistant/cloudContract';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const {
    context,
    pendingProposal,
    lastReceipt,
    assistantMessage,
    interpret,
    confirmProposal,
    cancelProposal,
    undoLastChange,
  } = useAssistantController();
  const [input, setInput] = useState('');
  // Local ephemeral conversation only: no transcript is persisted to SQLite.
  const [cloudHistory, setCloudHistory] = useState<BrainChatTurn[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [cloudSuggestion, setCloudSuggestion] = useState<BrainChatSuggestion | null>(null);

  async function askCloudBrain() {
    if (cloudBusy || !input.trim() || pendingProposal) return;
    const message = input.trim();
    setCloudBusy(true);
    setCloudError('');
    setCloudSuggestion(null);
    try {
      const result = await talkToBrainAI(message, {
        date: context.generatedAt,
        energy: context.energy,
        jornada: context.jornadaLabel,
        move: context.move.label,
        rest: context.rest.title,
        foodCount: context.food.countToday,
      }, cloudHistory);
      setCloudHistory(previous => [...previous, { role: 'user', text: message }, { role: 'assistant', text: result.reply }].slice(-6) as BrainChatTurn[]);
      setCloudSuggestion(result.suggestion.kind === 'none' ? null : result.suggestion);
      setInput('');
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : 'No se pudo usar IA. Interpretar local sigue disponible.');
    } finally {
      setCloudBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Brand />
        <Text style={styles.eyebrow}>ASISTENTE</Text>

        <Text style={styles.section}>CUÉNTAME QUÉ CAMBIÓ</Text>
        <View style={styles.inputCard}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ej: ¿ya entrené hoy?"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
            accessibilityLabel="Cuéntame qué cambió"
          />
          <Pressable
            style={styles.interpretButton}
            onPress={() => {
              if (interpret(input) === 'answered') setInput('');
            }}
            disabled={!input.trim()}
          >
            <Text style={styles.interpretButtonText}>Interpretar</Text>
          </Pressable>
          {brainCloudConfigured ? (
            <View style={styles.cloudArea}>
              <Text style={styles.cloudNotice}>
                IA opcional: al tocar «Conversar con IA», tu texto, hasta 6 mensajes recientes
                y un resumen de energía, jornada, Move, Food (solo cantidad) y Rest
                se envían a WeekFlow en Supabase y al proveedor OpenAI.
                No adjuntamos fotos, nombre de perfil ni el horario semanal completo.
                Evita escribir datos sensibles o de otras personas.
              </Text>
              <Pressable
                style={[styles.cloudButton, (cloudBusy || Boolean(pendingProposal) || !input.trim()) && { opacity: 0.45 }]}
                disabled={cloudBusy || Boolean(pendingProposal) || !input.trim()}
                onPress={() => { void askCloudBrain(); }}
                accessibilityRole="button"
                accessibilityLabel="Conversar con IA y enviar mensaje y contexto mínimo"
              >
                <Text style={styles.cloudButtonText}>{cloudBusy ? 'Consultando IA…' : 'Conversar con IA · enviar'}</Text>
              </Pressable>
              {cloudHistory.length > 0 ? (
                <View style={styles.cloudConversation}>
                  {cloudHistory.map((turn, index) => (
                    <View key={index} style={styles.cloudTurn}>
                      <Text style={styles.cloudSpeaker}>{turn.role === 'user' ? 'TÚ' : 'WEEKFLOW BRAIN'}</Text>
                      <Text style={styles.cloudReply}>{turn.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {cloudSuggestion ? (
                <View style={styles.cloudSuggestion}>
                  <Text style={styles.cloudReply}>La IA sugiere revisar: {brainSuggestionLabel(cloudSuggestion)}</Text>
                  <Pressable style={styles.reviewExitButton} onPress={() => {
                    const command = brainSuggestionToLocalCommand(cloudSuggestion);
                    setCloudSuggestion(null);
                    if (command) interpret(command);
                  }}>
                    <Text style={styles.reviewExitButtonText}>Revisar propuesta en WeekFlow →</Text>
                  </Pressable>
                </View>
              ) : null}
              {cloudError ? <Text style={styles.assistantMessage}>{cloudError}</Text> : null}
            </View>
          ) : null}
          {assistantMessage ? <Text style={styles.assistantMessage}>{assistantMessage}</Text> : null}
          {context.needsExitReview && !pendingProposal ? (
            <Pressable
              style={styles.reviewExitButton}
              accessibilityRole="button"
              onPress={() => router.push('/')}
            >
              <Text style={styles.reviewExitButtonText}>Revisar reajuste en Ahora →</Text>
            </Pressable>
          ) : null}
          {(lastReceipt?.kind === 'set-move-target' || lastReceipt?.kind === 'set-energy-move') && !pendingProposal ? (
            <Pressable
              style={styles.reviewExitButton}
              accessibilityRole="button"
              onPress={() => router.push('/pillars')}
            >
              <Text style={styles.reviewExitButtonText}>Ver rutina en Move →</Text>
            </Pressable>
          ) : null}
          {lastReceipt && !pendingProposal ? (
            <Pressable
              style={styles.undoButton}
              accessibilityRole="button"
              accessibilityLabel="Deshacer último cambio del Asistente"
              onPress={undoLastChange}
            >
              <Text style={styles.undoButtonText}>↶ Deshacer cambio</Text>
            </Pressable>
          ) : null}
        </View>

        {pendingProposal ? (
          <View style={styles.proposalCard}>
            <Text style={styles.proposalLabel}>PROPUESTA</Text>
            <Text style={styles.proposalTitle}>{pendingProposal.title}</Text>
            <Text style={styles.proposalBody}>{pendingProposal.explanation}</Text>
            <View style={styles.proposalActions}>
              <Pressable style={styles.cancelButton} onPress={cancelProposal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={() => {
                  if (confirmProposal()) setInput('');
                }}
              >
                <Text style={styles.confirmButtonText}>Confirmar cambio</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>ESTADO REAL</Text>
        <View style={styles.heroCard}>
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
          </View>
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>FOOD</Text>
            <Text style={styles.contextValue}>{context.food.label}</Text>
            {context.food.lastTitle ? <Text style={styles.contextMeta}>Último · {context.food.lastTitle}</Text> : null}
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
  inputCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 14 },
  input: { minHeight: 72, color: colors.text, fontSize: 15, lineHeight: 21, textAlignVertical: 'top', padding: 0 },
  interpretButton: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: '#245D9C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  interpretButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  assistantMessage: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  cloudArea: { marginTop: 15, borderTopWidth: 1, borderColor: colors.line, paddingTop: 12 },
  cloudNotice: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  cloudButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 10, backgroundColor: '#245D9C', paddingHorizontal: 14, borderRadius: 14 },
  cloudButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cloudConversation: { marginTop: 12, gap: 9 },
  cloudTurn: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  cloudSpeaker: { color: '#8BBEFF', fontSize: 10, letterSpacing: 1.3, fontWeight: '900' },
  cloudReply: { color: colors.text, marginTop: 5, fontSize: 13, lineHeight: 19 },
  cloudSuggestion: { backgroundColor: colors.bg, borderRadius: 10, padding: 10, marginTop: 10 },
  reviewExitButton: { alignSelf: 'flex-start', marginTop: 8, minHeight: 44, justifyContent: 'center', paddingVertical: 8, paddingRight: 12 },
  reviewExitButtonText: { color: '#8BBEFF', fontWeight: '800', fontSize: 13 },
  undoButton: { alignSelf: 'flex-start', marginTop: 8, minHeight: 44, justifyContent: 'center', paddingVertical: 8, paddingRight: 12 },
  undoButtonText: { color: '#8BBEFF', fontWeight: '800', fontSize: 13 },
  proposalCard: { marginTop: 10, backgroundColor: '#102A4D', borderWidth: 1, borderColor: '#2A5D99', borderRadius: 20, padding: 15 },
  proposalLabel: { color: '#8BBEFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  proposalTitle: { color: colors.text, fontWeight: '900', fontSize: 17, lineHeight: 22, marginTop: 5 },
  proposalBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  proposalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: { flex: 1, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  confirmButton: { flex: 1.4, paddingVertical: 11, borderRadius: 14, backgroundColor: '#245D9C', alignItems: 'center' },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
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
