import { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, PanResponder, StyleSheet, View } from 'react-native';
import { BottomNav } from '@/src/components/BottomNav';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gesture) => (
      gesture.y0 < 190
      && gesture.dy > 48
      && Math.abs(gesture.dx) < 36
      && !refreshing
    ),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < 72 || refreshing) return;
      setRefreshing(true);
      setRefreshKey((value) => value + 1);
      setTimeout(() => setRefreshing(false), 450);
    },
    onPanResponderTerminate: () => undefined,
  }), [refreshing]);

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Stack key={refreshKey} screenOptions={{ headerShown: false, animation: 'fade' }} />
      </View>

      {refreshing ? (
        <View pointerEvents="none" style={styles.refreshPill}>
          <ActivityIndicator size="small" color={colors.blue} />
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.navLayer}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  refreshPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    minWidth: 42,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08152A',
    borderWidth: 1,
    borderColor: colors.line,
    zIndex: 40,
  },
  navLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
});
