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
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
