import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`) || (item.path === '/week' && pathname === '/import');
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
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#071526',
    borderTopWidth: 1,
    borderTopColor: '#173151',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  icon: { color: '#7187A6', fontSize: 19, fontWeight: '800' },
  label: { color: '#7187A6', fontSize: 10, fontWeight: '800', marginTop: 3 },
  active: { color: colors.blue },
});
