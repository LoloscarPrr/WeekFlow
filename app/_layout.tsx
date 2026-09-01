import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, View } from 'react-native';
import { BottomNav } from '@/src/components/BottomNav';
import { useAdaptiveLayout } from '@/src/presentation/layout/useAdaptiveLayout';
import { syncLivePlanReminders } from '@/src/services/notifications';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const { isWide, stageMaxWidth } = useAdaptiveLayout();

  useEffect(() => {
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
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={[styles.screenStage, isWide && { maxWidth: stageMaxWidth }]}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </View>
      </View>

      <View style={styles.navLayer}>
        <BottomNav />
      </View>
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
