import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { BottomNav } from '@/src/components/BottomNav';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </View>
      <View pointerEvents="box-none" style={styles.navLayer}>
        <BottomNav />
      </View>
    </View>
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
