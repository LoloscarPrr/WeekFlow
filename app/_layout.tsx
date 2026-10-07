import { useEffect, useState } from 'react';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, View } from 'react-native';
import { BottomNav } from '@/src/components/BottomNav';
import { useAdaptiveLayout } from '@/src/presentation/layout/useAdaptiveLayout';
import { syncLivePlanReminders } from '@/src/services/notifications';
import { shouldShowOnboarding } from '@/src/onboarding/persistence';
import { syncCrashReportingConsent } from '@/src/privacy/crashReporting';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const { isWide, stageMaxWidth } = useAdaptiveLayout();
  const pathname = usePathname();
  const [onboardingRequired, setOnboardingRequired] = useState<boolean | null>(null);

  useEffect(() => {
    const required = shouldShowOnboarding();
    setOnboardingRequired(required);

    if (required && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (!required && pathname === '/onboarding') {
      router.replace('/');
    }
  }, [pathname]);

  useEffect(() => {
    void syncCrashReportingConsent();
  }, []);

  useEffect(() => {
    if (onboardingRequired !== false) return;

    void syncLivePlanReminders().catch((error) => {
      console.warn('Could not sync WeekFlow reminders', error);
    });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void syncLivePlanReminders().catch((error) => {
        console.warn('Could not refresh WeekFlow reminders', error);
      });
    });

    return () => subscription.remove();
  }, [onboardingRequired]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={[styles.screenStage, isWide && { maxWidth: stageMaxWidth }]}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </View>
      </View>

      {onboardingRequired === false && pathname !== '/onboarding' ? (
        <View style={styles.navLayer}>
          <BottomNav />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center' },
  screenStage: { flex: 1, width: '100%' },
  navLayer: {
    zIndex: 20,
  },
});
