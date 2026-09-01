import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdaptiveLayout } from '@/src/presentation/layout/useAdaptiveLayout';
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
  const { isCompact, isWide, navMaxWidth } = useAdaptiveLayout();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.shell,
        isCompact && styles.shellCompact,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={[styles.wrap, isCompact && styles.wrapCompact, isWide && { maxWidth: navMaxWidth }]}> 
        {items.map((item) => {
          const active = item.path === '/'
            ? pathname === '/'
            : pathname === item.path
              || pathname.startsWith(`${item.path}/`)
              || (item.path === '/week' && pathname === '/import')
              || (item.path === '/pillars' && ['/food', '/rest'].includes(pathname));
          return (
            <Pressable
              key={item.path}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={[styles.item, isCompact && styles.itemCompact]}
              onPress={() => router.replace(item.path)}
            >
              <Text style={[styles.icon, isCompact && styles.iconCompact, active && styles.active]}>{item.icon}</Text>
              <Text style={[styles.label, isCompact && styles.labelCompact, active && styles.active]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  shellCompact: {
    paddingHorizontal: 4,
  },
  wrap: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  wrapCompact: {
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  itemCompact: {
    minHeight: 42,
  },
  icon: { color: '#7187A6', fontSize: 16, fontWeight: '800' },
  iconCompact: { fontSize: 15 },
  label: { color: '#7187A6', fontSize: 9, fontWeight: '800', marginTop: 1 },
  labelCompact: { fontSize: 8 },
  active: { color: colors.blue },
});
