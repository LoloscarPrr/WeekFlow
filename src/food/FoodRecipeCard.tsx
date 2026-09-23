import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  foodMatchLabel,
  foodMissingLabel,
  type FoodRecipeMatch,
} from './recommendations';
import { colors } from '@/src/theme/colors';

export function FoodRecipeCard({
  match,
  onCook,
  onAddMissing,
  compact = false,
}: {
  match: FoodRecipeMatch;
  onCook: () => void;
  onAddMissing: () => void;
  compact?: boolean;
}) {
  const { recipe } = match;
  const ready = match.missing.length === 0;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.head}>
        <Text style={styles.icon}>{recipe.icon}</Text>
        <View style={styles.headCopy}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.meta}>
            {recipe.minutes} min · {recipe.portions} porción{recipe.portions === 1 ? '' : 'es'} · {recipe.difficulty}
          </Text>
        </View>
        <View style={[styles.fitBadge, ready && styles.fitBadgeReady]}>
          <Text style={[styles.fitText, ready && styles.fitTextReady]}>
            {foodMatchLabel(match)}
          </Text>
        </View>
      </View>

      <Text style={[styles.missing, ready && styles.ready]}>{foodMissingLabel(match)}</Text>

      {match.optionalMissing.length ? (
        <Text style={styles.optional}>
          Opcional: {match.optionalMissing.map((item) => item.name).join(', ')}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={onCook}>
          <Text style={styles.primaryText}>Cocinar conmigo</Text>
        </Pressable>
        {match.missing.length ? (
          <Pressable style={styles.secondary} onPress={onAddMissing}>
            <Text style={styles.secondaryText}>+ Faltantes a compras</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
  },
  cardCompact: { padding: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { fontSize: 30, width: 38 },
  headCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 20 },
  meta: { color: '#7890AE', fontSize: 10, fontWeight: '800', marginTop: 3 },
  fitBadge: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#685730',
    backgroundColor: '#332B18',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  fitBadgeReady: {
    borderColor: '#347363',
    backgroundColor: '#153A31',
  },
  fitText: { color: '#E5C779', fontSize: 9, fontWeight: '900' },
  fitTextReady: { color: '#8CE0C7' },
  missing: { color: '#E5C779', fontSize: 11, fontWeight: '800', marginTop: 10, lineHeight: 16 },
  ready: { color: '#8CE0C7' },
  optional: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  primary: { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: colors.blue },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  secondary: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#356596',
    backgroundColor: '#112C4B',
  },
  secondaryText: { color: '#A9CEFA', fontSize: 11, fontWeight: '900' },
});
