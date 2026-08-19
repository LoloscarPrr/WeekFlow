import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, StyleSheet, View } from 'react-native';
import { BottomNav } from '@/src/components/BottomNav';
import { syncLivePlanReminders } from '@/src/services/notifications';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
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
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </View>

      <View style={styles.navLayer}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  navLayer: {
    zIndex: 20,
  },
});
