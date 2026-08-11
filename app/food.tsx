import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import {
  loadDayState,
  loadFoodDay,
  loadWeekState,
  removeFoodEntry,
  saveFoodEntry,
  shiftForDate,
  type FoodDayRecord,
  type FoodEntry,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

type FoodContext = 'free' | 'before' | 'working' | 'after';
type Suggestion = {
  id: string;
  icon: string;
  title: string;
  copy: string;
  tag: string;
  kind: FoodEntry['kind'];
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function foodContextForShift(now: Date, shift: ReturnType<typeof shiftForDate>): FoodContext {
  if (shift.type === 'off' || !shift.start || !shift.end) return 'free';
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const overnight = end <= start;
  const working = overnight ? current >= start || current < end : current >= start && current < end;
  if (working) return 'working';

  const untilStart = (start - current + 1440) % 1440;
  if (untilStart <= 180) return 'before';
  const sinceEnd = (current - end + 1440) % 1440;
  if (sinceEnd <= 240) return 'after';
  return 'free';
}

function suggestionsFor(context: FoodContext, hour: number, lowEnergy: boolean): Suggestion[] {
  if (context === 'working') {
    return [
      { id: 'work-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Rápido, fácil de llevar y sin cocinar.', tag: 'Snack de turno', kind: 'snack' },
      { id: 'work-sandwich', icon: '🥪', title: 'Sándwich simple + verdura', copy: 'Pan con huevo, pollo o queso y algo fresco.', tag: 'Más completo', kind: 'meal' },
      { id: 'work-fruit', icon: '🍌', title: 'Fruta + lácteo', copy: 'Una opción corta cuando no tienes mucho tiempo.', tag: 'Muy rápido', kind: 'snack' },
      { id: 'work-water', icon: '💧', title: 'Agua', copy: 'Si llevas rato sin tomar, este puede ser un buen momento.', tag: 'Hidratación', kind: 'drink' },
    ];
  }

  if (context === 'before') {
    return [
      { id: 'before-egg', icon: '🍳', title: 'Pan con huevo + fruta', copy: 'Algo sencillo antes del turno, sin complicarte.', tag: 'Antes de trabajar', kind: 'meal' },
      { id: 'before-oats', icon: '🥣', title: 'Yogur o leche + avena + fruta', copy: 'Se arma rápido y puedes ajustar la cantidad a tu hambre.', tag: 'Rápido', kind: 'meal' },
      { id: 'before-sandwich', icon: '🥪', title: 'Sándwich casero + agua', copy: 'Práctico si vas saliendo y necesitas llevarlo.', tag: 'Para llevar', kind: 'meal' },
    ];
  }

  if (context === 'after') {
    return [
      { id: 'after-plate', icon: '🍲', title: 'Plato simple de casa', copy: 'Arroz o papa + legumbres, huevo o pollo + verduras.', tag: 'Después del turno', kind: 'meal' },
      { id: 'after-egg', icon: '🍳', title: 'Huevo + pan + tomate', copy: 'Pocos pasos para cuando quieres comer y bajar el ritmo.', tag: 'Fácil', kind: 'meal' },
      { id: 'after-yogurt', icon: '🥣', title: 'Yogur + avena + fruta', copy: 'Una alternativa liviana si no quieres cocinar mucho.', tag: 'Sin apuro', kind: 'meal' },
    ];
  }

  if (hour < 11) {
    return [
      { id: 'free-breakfast-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Desayuno simple que no necesita cocina.', tag: 'Desayuno', kind: 'meal' },
      { id: 'free-breakfast-egg', icon: '🍳', title: 'Pan con huevo y tomate', copy: 'Caliente, simple y fácil de adaptar.', tag: 'Desayuno', kind: 'meal' },
      { id: 'free-breakfast-oats', icon: '🥛', title: 'Avena + leche o yogur + fruta', copy: 'Una base fácil para una mañana tranquila.', tag: 'Desayuno', kind: 'meal' },
    ];
  }

  if (hour < 16) {
    return [
      { id: 'free-lunch-plate', icon: '🍛', title: 'Plato simple y completo', copy: 'Arroz, papa o pasta + legumbres, huevo o pollo + verduras.', tag: 'Almuerzo', kind: 'meal' },
      { id: 'free-lunch-sandwich', icon: '🥪', title: 'Sándwich + fruta', copy: 'Útil cuando quieres resolver sin cocinar demasiado.', tag: 'Rápido', kind: 'meal' },
      { id: 'free-lunch-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Para un momento con poco tiempo o poca hambre.', tag: 'Snack', kind: 'snack' },
    ];
  }

  const simpleCopy = lowEnergy ? 'Pocos pasos: hoy conviene que comer sea fácil.' : 'Simple y fácil de adaptar a lo que tengas.';
  return [
    { id: 'free-evening-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Una colación rápida para la tarde.', tag: 'Colación', kind: 'snack' },
    { id: 'free-evening-egg', icon: '🍳', title: 'Pan con huevo o queso + tomate', copy: simpleCopy, tag: 'Once / comida', kind: 'meal' },
    { id: 'free-evening-fruit', icon: '🍎', title: 'Fruta + yogur', copy: 'Dos cosas simples cuando quieres algo rápido.', tag: 'Muy rápido', kind: 'snack' },
  ];
}

function contextTitle(context: FoodContext) {
  if (context === 'working') return 'Estás en tu turno';
  if (context === 'before') return 'Antes del trabajo';
  if (context === 'after') return 'Después del turno';
  return 'Tu día está más abierto';
}

function contextCopy(context: FoodContext) {
  if (context === 'working') return 'Te propongo cosas fáciles de llevar o resolver sin convertir la comida en otra tarea.';
  if (context === 'before') return 'La idea es llegar con algo comido sin hacerte perder tiempo antes de salir.';
  if (context === 'after') return 'Primero algo viable para comer y bajar revoluciones; no una receta perfecta.';
  return 'Elegimos según la hora, tu energía y lo que ya registraste hoy.';
}

function timeLabel(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function FoodScreen() {
  const now = useMemo(() => new Date(), []);
  const dayState = useMemo(() => loadDayState(), []);
  const weekState = useMemo(() => loadWeekState(), []);
  const todayShift = useMemo(() => shiftForDate(weekState, now), [now, weekState]);
  const context = useMemo(() => foodContextForShift(now, todayShift), [now, todayShift]);
  const lowEnergy = dayState.energy === 'cansado' || dayState.energy === 'agotado';
  const baseSuggestions = useMemo(() => suggestionsFor(context, now.getHours(), lowEnergy), [context, lowEnergy, now]);

  const [foodDay, setFoodDay] = useState<FoodDayRecord>(() => loadFoodDay(now));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');

  const loggedTitles = useMemo(() => new Set(foodDay.entries.map((item) => item.title)), [foodDay.entries]);
  const suggestions = useMemo(() => {
    const fresh = baseSuggestions.filter((item) => !loggedTitles.has(item.title));
    return (fresh.length >= 3 ? fresh : baseSuggestions).slice(0, 3);
  }, [baseSuggestions, loggedTitles]);

  function addSuggestion(item: Suggestion) {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 42 },
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
