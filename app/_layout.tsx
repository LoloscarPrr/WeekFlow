import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const pathname = usePathname();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {pathname === '/' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Importar horario"
          style={styles.importButton}
          onPress={() => router.push('/import')}
        >
          <Text style={styles.importText}>▣ Importar horario</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  importButton: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    backgroundColor: colors.blue,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#65B8FF',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  importText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});