import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';

type PillarTab = 'move' | 'food';

export function PillarTabs({ active }: { active: PillarTab }) {
  return (
    <View style={styles.wrap}>
      <Pressable style={[styles.tab, active === 'move' && styles.tabActive]} onPress={() => router.replace('/pillars')}>
        <Text style={[styles.text, active === 'move' && styles.textActive]}>Move</Text>
      </Pressable>
      <Pressable style={[styles.tab, active === 'food' && styles.tabActive]} onPress={() => router.replace('/food')}>
        <Text style={[styles.text, active === 'food' && styles.textActive]}>Food</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 22,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#173B69',
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  textActive: {
    color: colors.text,
  },
});
