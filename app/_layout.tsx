import { useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppRefreshProvider } from '@/src/components/AppRefresh';
import { BottomNav } from '@/src/components/BottomNav';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const [refreshKey, setRefreshKey] = useState(0);
  const requestRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <AppRefreshProvider onRefresh={requestRefresh}>
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <Stack key={refreshKey} screenOptions={{ headerShown: false, animation: 'fade' }} />
        </View>

        <View pointerEvents="box-none" style={styles.navLayer}>
          <BottomNav />
        </View>
      </View>
    </AppRefreshProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  navLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
});
