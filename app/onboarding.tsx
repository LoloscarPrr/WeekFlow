import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Brand } from '@/src/components/Brand';
import { cleanOnboardingName } from '@/src/onboarding/core';
import { completeOnboarding, saveOnboardingName } from '@/src/onboarding/persistence';
import { loadUserProfile } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

export default function OnboardingScreen() {
  const [name, setName] = useState(() => loadUserProfile().name);

  function finish(next: 'week' | 'later') {
    const cleanName = cleanOnboardingName(name);
    if (cleanName) saveOnboardingName(cleanName);
    completeOnboarding(next);
    router.replace(next === 'week' ? '/week' : '/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Brand />

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>BIENVENIDO A WEEKFLOW</Text>
            <Text style={styles.title}>Tu semana. Tu ritmo. Tu equilibrio.</Text>
            <Text style={styles.lead}>
              Partamos con lo mínimo. WeekFlow puede conocerte poco a poco, justo cuando cada dato sea útil.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>OPCIONAL</Text>
            <Text style={styles.cardTitle}>¿Cómo quieres que te llamemos?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={60}
              placeholder="Tu nombre"
              placeholderTextColor="#65758D"
              style={styles.input}
              returnKeyType="done"
              autoCapitalize="words"
              accessibilityLabel="Tu nombre"
            />
            <Text style={styles.hint}>Puedes dejarlo vacío. No necesitas crear una cuenta para usar WeekFlow.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>LO IMPORTANTE PRIMERO</Text>
            <Text style={styles.cardTitle}>Tu semana manda</Text>
            <Text style={styles.copy}>
              Si configuras tus jornadas, WeekFlow puede ordenar el resto alrededor de tu realidad. También puedes hacerlo después.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Configurar mi semana"
              style={styles.primary}
              onPress={() => finish('week')}
            >
              <Text style={styles.primaryText}>Configurar mi semana</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar a WeekFlow"
              style={styles.secondary}
              onPress={() => finish('later')}
            >
              <Text style={styles.secondaryText}>Entrar a WeekFlow</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Después podrás ajustar Move, Food, Rest, hábitos y notificaciones desde su propio contexto. No tienes que decidirlo todo hoy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  hero: { marginTop: 40, marginBottom: 24 },
  eyebrow: {
    color: '#76AFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.7,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 10,
  },
  lead: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardLabel: {
    color: '#76AFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 7,
  },
  copy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  input: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2A4E7A',
    backgroundColor: colors.surface2,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },
  primary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondary: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#31577F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: '#BDD8FF',
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    color: '#7187A6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 14,
  },
});
