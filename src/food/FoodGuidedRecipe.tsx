import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/src/components/Brand';
import type { FoodRecipe } from '@/src/food/recipes';
import { colors } from '@/src/theme/colors';

export function FoodGuidedRecipe({
  recipe,
  onCancel,
  onComplete,
}: {
  recipe: FoodRecipe;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const lastStep = step === recipe.steps.length - 1;
  const progress = started ? Math.round(((step + 1) / recipe.steps.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <Pressable onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeText}>Salir</Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>FOOD · COCINA CONMIGO</Text>
        <Text style={styles.icon}>{recipe.icon}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>{recipe.minutes} min · {recipe.portions} porción{recipe.portions === 1 ? '' : 'es'} · {recipe.difficulty}</Text>

        {!started ? (
          <>
            <Text style={styles.section}>INGREDIENTES</Text>
            <View style={styles.card}>
              {recipe.ingredients.map((item, index) => (
                <View key={`${item.name}-${index}`} style={[styles.row, index === recipe.ingredients.length - 1 && styles.rowLast]}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingredient}>{item.name}</Text>
                    <Text style={styles.amount}>{item.amount}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.section}>SI TE FALTA ALGO</Text>
            <View style={styles.swapCard}>
              {recipe.substitutions.map((item, index) => (
                <Text key={`${item}-${index}`} style={styles.swap}>• {item}</Text>
              ))}
            </View>

            <Pressable style={styles.primary} onPress={() => setStarted(true)}>
              <Text style={styles.primaryText}>Empezar a cocinar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>PASO {step + 1} DE {recipe.steps.length}</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>

            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>{step + 1}</Text>
              <Text style={styles.stepText}>{recipe.steps[step]}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.secondary, step === 0 && styles.disabled]}
                disabled={step === 0}
                onPress={() => setStep((value) => Math.max(0, value - 1))}
              >
                <Text style={styles.secondaryText}>Anterior</Text>
              </Pressable>
              <Pressable
                style={styles.primaryInline}
                onPress={() => {
                  if (lastStep) onComplete();
                  else setStep((value) => value + 1);
                }}
              >
                <Text style={styles.primaryText}>{lastStep ? 'Listo, comí esto' : 'Siguiente'}</Text>
              </Pressable>
            </View>

            <Text style={styles.helper}>WeekFlow te guía paso a paso. Si necesitas cambiar un ingrediente, usa una sustitución de arriba o vuelve y elige otra opción.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 150 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  closeText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 28 },
  icon: { fontSize: 48, marginTop: 18 },
  title: { color: colors.text, fontSize: 36, lineHeight: 41, fontWeight: '900', marginTop: 8 },
  meta: { color: '#8FB6E5', fontSize: 13, fontWeight: '800', marginTop: 10 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 28, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLast: { borderBottomWidth: 0 },
  bullet: { color: '#76AFFF', fontSize: 18, lineHeight: 21 },
  ingredient: { color: colors.text, fontWeight: '900', fontSize: 14 },
  amount: { color: colors.muted, fontSize: 12, marginTop: 3 },
  swapCard: { backgroundColor: '#122A43', borderWidth: 1, borderColor: '#28577F', borderRadius: 20, padding: 16, gap: 8 },
  swap: { color: '#BFD2E8', fontSize: 13, lineHeight: 19 },
  primary: { marginTop: 24, backgroundColor: colors.blue, borderRadius: 17, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryInline: { flex: 1, backgroundColor: colors.blue, borderRadius: 15, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
  progressLabel: { color: '#76AFFF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  progressPercent: { color: '#8FB6E5', fontSize: 12, fontWeight: '900' },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#0B1B2D', marginTop: 10 },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.blue },
  stepCard: { marginTop: 22, minHeight: 240, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#2D5C8D', borderRadius: 26, padding: 22, justifyContent: 'center' },
  stepNumber: { color: '#76AFFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  stepText: { color: colors.text, fontSize: 24, lineHeight: 33, fontWeight: '900', marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondary: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#A9BED9', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  helper: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 18 },
});
