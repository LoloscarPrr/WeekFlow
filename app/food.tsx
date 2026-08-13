import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { RefreshableScrollView } from '@/src/components/AppRefresh';
import { contextCopy, contextTitle, foodContextForShift, suggestionsFor, type FoodSuggestion } from '@/src/food/suggestions';
import {
  loadDayState,
  loadFoodDay,
  loadWeekState,
  removeFoodEntry,
  saveFoodEntry,
  shiftForDate,
  type FoodDayRecord,
  type FoodEntry,
  type PersistedDayState,
  type PersistedWeekState,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

function timeLabel(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function FoodScreen() {
  const initialNow = useMemo(() => new Date(), []);
  const [clockNow, setClockNow] = useState(initialNow);
  const [dayState, setDayState] = useState<PersistedDayState>(() => loadDayState());
  const [weekState, setWeekState] = useState<PersistedWeekState>(() => loadWeekState());
  const [foodDay, setFoodDay] = useState<FoodDayRecord>(() => loadFoodDay(initialNow));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const todayShift = useMemo(() => shiftForDate(weekState, clockNow), [clockNow, weekState]);
  const context = useMemo(() => foodContextForShift(clockNow, todayShift), [clockNow, todayShift]);
  const lowEnergy = dayState.energy === 'cansado' || dayState.energy === 'agotado';
  const baseSuggestions = useMemo(() => suggestionsFor(context, clockNow.getHours(), lowEnergy), [clockNow, context, lowEnergy]);

  const loggedTitles = useMemo(() => new Set(foodDay.entries.map((item) => item.title)), [foodDay.entries]);
  const suggestions = useMemo(
    () => baseSuggestions.filter((item) => !loggedTitles.has(item.title)).slice(0, 3),
    [baseSuggestions, loggedTitles],
  );

  const refreshFood = useCallback(() => {
    const now = new Date();
    setClockNow(now);
    setDayState(loadDayState());
    setWeekState(loadWeekState());
    setFoodDay(loadFoodDay(now));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshFood();
    }, [refreshFood]),
  );

  function addSuggestion(item: FoodSuggestion) {
    if (loggedTitles.has(item.title)) return;
    const entry: FoodEntry = {
      id: `${Date.now()}-${item.id}`,
      at: new Date().toISOString(),
      title: item.title,
      kind: item.kind,
      source: 'suggestion',
    };
    setFoodDay(saveFoodEntry(entry));
  }

  function addManual() {
    const title = manualText.trim();
    if (!title) return;
    const entry: FoodEntry = {
      id: `${Date.now()}-manual`,
      at: new Date().toISOString(),
      title,
      kind: 'other',
      source: 'manual',
    };
    setFoodDay(saveFoodEntry(entry));
    setManualText('');
    setManualOpen(false);
  }

  function removeEntry(id: string) {
    setFoodDay(removeFoodEntry(id));
  }

  function keepManualVisible() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 160);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <RefreshableScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefreshData={refreshFood}
        >
          <Brand />
          <PillarTabs active="food" />

          <Text style={styles.eyebrow}>PILARES · FOOD</Text>
          <Text style={styles.title}>Come según tu día, no según una hora perfecta.</Text>
          <Text style={styles.copy}>Food mira tu turno, tu energía y lo que ya registraste hoy para proponerte algo viable.</Text>

          <View style={styles.contextCard}>
            <Text style={styles.contextEyebrow}>AHORA</Text>
            <Text style={styles.contextTitle}>{contextTitle(context)}</Text>
            <Text style={styles.contextCopy}>{contextCopy(context)}</Text>
            {todayShift.type !== 'off' ? <Text style={styles.shiftText}>Turno · {todayShift.start}–{todayShift.end}</Text> : <Text style={styles.shiftText}>Día libre</Text>}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.section}>TE PROPONGO</Text>
            <Text style={styles.sectionMeta}>{foodDay.entries.length} registrado{foodDay.entries.length === 1 ? '' : 's'} hoy</Text>
          </View>

          {suggestions.length ? (
            <View style={styles.suggestions}>
              {suggestions.map((item) => (
                <View key={item.id} style={styles.suggestionCard}>
                  <View style={styles.suggestionIcon}><Text style={styles.suggestionEmoji}>{item.icon}</Text></View>
                  <View style={styles.suggestionBody}>
                    <Text style={styles.suggestionTag}>{item.tag}</Text>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionCopy}>{item.copy}</Text>
                  </View>
                  <Pressable style={styles.logButton} onPress={() => addSuggestion(item)}>
                    <Text style={styles.logButtonText}>Ya comí esto</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.allLoggedCard}>
              <Text style={styles.allLoggedTitle}>Esas sugerencias ya están registradas.</Text>
              <Text style={styles.allLoggedCopy}>No te las vuelvo a ofrecer como si no hubieran pasado.</Text>
            </View>
          )}

          <Text style={styles.section}>HOY</Text>
          {foodDay.entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no has registrado nada.</Text>
              <Text style={styles.emptyCopy}>No pasa nada. Food empieza a aprender cuando tú le cuentas, no te persigue para completar casillas.</Text>
            </View>
          ) : (
            <View style={styles.logCard}>
              {foodDay.entries.map((entry, index) => (
                <View key={entry.id} style={[styles.logRow, index === foodDay.entries.length - 1 && styles.logRowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logTime}>{timeLabel(entry.at)}</Text>
                    <Text style={styles.logTitle}>{entry.title}</Text>
                    <Text style={styles.logSource}>{entry.source === 'manual' ? 'Registrado por ti' : 'Desde una sugerencia'}</Text>
                  </View>
                  <Pressable onPress={() => removeEntry(entry.id)} style={styles.removeButton}>
                    <Text style={styles.removeText}>Quitar</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {!manualOpen ? (
            <Pressable style={styles.manualButton} onPress={() => setManualOpen(true)}>
              <Text style={styles.manualButtonText}>+ Comí otra cosa</Text>
            </Pressable>
          ) : (
            <View style={styles.manualCard}>
              <Text style={styles.manualLabel}>¿Qué comiste?</Text>
              <TextInput
                value={manualText}
                onChangeText={setManualText}
                placeholder="Ej: arroz con pollo"
                placeholderTextColor="#607493"
                style={styles.input}
                autoFocus
                returnKeyType="done"
                onFocus={keepManualVisible}
                onSubmitEditing={addManual}
              />
              <View style={styles.manualActions}>
                <Pressable style={styles.cancelButton} onPress={() => { setManualOpen(false); setManualText(''); }}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.saveButton, !manualText.trim() && styles.saveDisabled]} disabled={!manualText.trim()} onPress={addManual}>
                  <Text style={styles.saveText}>Registrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </RefreshableScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboardShell: { flex: 1 },
  content: { padding: 22, paddingBottom: 148 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 24 },
  title: { color: colors.text, fontWeight: '900', fontSize: 38, lineHeight: 44, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  contextCard: { marginTop: 24, backgroundColor: '#12304E', borderWidth: 1, borderColor: '#29577D', borderRadius: 24, padding: 18 },
  contextEyebrow: { color: '#79B6FF', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  contextTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  contextCopy: { color: '#B8C9DE', fontSize: 14, lineHeight: 21, marginTop: 7 },
  shiftText: { color: '#78AEEC', fontSize: 12, fontWeight: '800', marginTop: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30, marginBottom: 12 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 4, fontSize: 14, marginTop: 30, marginBottom: 12 },
  sectionMeta: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  suggestions: { gap: 10 },
  suggestionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 16 },
  suggestionIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#285785' },
  suggestionEmoji: { fontSize: 23 },
  suggestionBody: { marginTop: 12 },
  suggestionTag: { color: '#74AEF5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  suggestionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  suggestionCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  logButton: { alignSelf: 'flex-start', marginTop: 13, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#173B69', borderWidth: 1, borderColor: '#3A76B9' },
  logButtonText: { color: '#DCEBFF', fontSize: 12, fontWeight: '900' },
  allLoggedCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 17 },
  allLoggedTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  allLoggedCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 17 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
  logCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  logRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  logRowLast: { borderBottomWidth: 0 },
  logTime: { color: '#76AFFF', fontSize: 11, fontWeight: '900' },
  logTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  logSource: { color: colors.muted, fontSize: 11, marginTop: 3 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 8 },
  removeText: { color: '#88A5C7', fontSize: 11, fontWeight: '800' },
  manualButton: { marginTop: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingVertical: 14, alignItems: 'center' },
  manualButtonText: { color: '#91BDF4', fontSize: 13, fontWeight: '900' },
  manualCard: { marginTop: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 16 },
  manualLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: { marginTop: 10, minHeight: 48, borderWidth: 1, borderColor: '#294768', borderRadius: 14, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.surface2, fontSize: 14 },
  manualActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line },
  cancelText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  saveButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 13, backgroundColor: colors.blue },
  saveDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
});
