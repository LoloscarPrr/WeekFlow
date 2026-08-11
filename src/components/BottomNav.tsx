import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';

const items = [
  { label: 'Ahora', icon: '◉', path: '/' },
  { label: 'Semana', icon: '▦', path: '/week' },
  { label: 'Pilares', icon: '◇', path: '/pillars' },
  { label: 'Jardín', icon: '✿', path: '/garden' },
  { label: 'Asistente', icon: '✦', path: '/assistant' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 6) + 2 }]}>
      <View style={styles.wrap}>
        {items.map((item) => {
          const active = item.path === '/'
            ? pathname === '/'
            : pathname === item.path
              || pathname.startsWith(`${item.path}/`)
              || (item.path === '/week' && pathname === '/import')
              || (item.path === '/pillars' && pathname === '/food');
          return (
            <Pressable
              key={item.path}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={styles.item}
              onPress={() => router.replace(item.path)}
            >
              <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
              <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingTop: 3,
  },
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  icon: { color: '#7187A6', fontSize: 16, fontWeight: '800' },
  label: { color: '#7187A6', fontSize: 9, fontWeight: '800', marginTop: 1 },
  active: { color: colors.blue },
});
