import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { PillarTabs } from '@/src/components/PillarTabs';
import { mergeFoodPantry } from '@/src/food/pantry';
import {
  loadFoodPantry,
  loadFoodShopping,
  saveFoodPantry,
  saveFoodShopping,
  type FoodPantryItem,
  type FoodShoppingItem,
} from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

export default function FoodShoppingScreen() {
  const [items, setItems] = useState<FoodShoppingItem[]>(() => loadFoodShopping());
  const [pantry, setPantry] = useState<FoodPantryItem[]>(() => loadFoodPantry());

  useFocusEffect(
    useCallback(() => {
      setItems(loadFoodShopping());
      setPantry(loadFoodPantry());
    }, []),
  );

  const pending = useMemo(() => items.filter((item) => !item.checked), [items]);
  const bought = useMemo(() => items.filter((item) => item.checked), [items]);
  const pantryKeys = useMemo(() => new Set(pantry.map((item) => item.key)), [pantry]);

  function persist(next: FoodShoppingItem[]) {
    setItems(saveFoodShopping(next));
  }

  function toggle(item: FoodShoppingItem) {
    persist(items.map((candidate) =>
      candidate.key === item.key ? { ...candidate, checked: !candidate.checked } : candidate,
    ));
  }

  function remove(key: string) {
    persist(items.filter((item) => item.key !== key));
  }

  function addToPantry(item: FoodShoppingItem) {
    const nextPantry = saveFoodPantry(mergeFoodPantry(pantry, [{ key: item.key, label: item.label }]));
    setPantry(nextPantry);
  }

  function renderItem(item: FoodShoppingItem) {
    const alreadyInPantry = pantryKeys.has(item.key);
    return (
      <View key={item.key} style={styles.row}>
        <Pressable style={[styles.check, item.checked && styles.checkActive]} onPress={() => toggle(item)}>
          <Text style={[styles.checkText, item.checked && styles.checkTextActive]}>{item.checked ? '✓' : ''}</Text>
        </Pressable>
        <View style={styles.rowCopy}>
          <Text style={[styles.itemTitle, item.checked && styles.itemBought]}>{item.label}</Text>
          <Text style={styles.itemMeta}>{item.checked ? 'Comprado' : 'Pendiente'}</Text>
        </View>
        <View style={styles.rowActions}>
          {item.checked && !alreadyInPantry ? (
            <Pressable style={styles.pantryButton} onPress={() => addToPantry(item)}>
              <Text style={styles.pantryButtonText}>+ Despensa</Text>
            </Pressable>
          ) : item.checked && alreadyInPantry ? (
            <Text style={styles.inPantry}>En despensa</Text>
          ) : null}
          <Pressable style={styles.removeButton} onPress={() => remove(item.key)}>
            <Text style={styles.removeText}>Quitar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Brand />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>
        <PillarTabs active="food" />

        <Text style={styles.eyebrow}>FOOD · COMPRAS</Text>
        <Text style={styles.title}>Compra solo lo que realmente falta.</Text>
        <Text style={styles.copy}>
          Los faltantes llegan desde recetas que elegiste. Marcar algo como comprado no modifica tu despensa hasta que tú lo confirmes.
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryNumber}>{pending.length}</Text>
            <Text style={styles.summaryLabel}>pendientes</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryNumber}>{bought.length}</Text>
            <Text style={styles.summaryLabel}>comprados</Text>
          </View>
        </View>

        <Text style={styles.section}>PENDIENTES</Text>
        <View style={styles.card}>
          {pending.length ? pending.map(renderItem) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tienes compras pendientes.</Text>
              <Text style={styles.emptyCopy}>Agrega faltantes desde una receta cuando los necesites.</Text>
            </View>
          )}
        </View>

        {bought.length ? (
          <>
            <Text style={styles.section}>COMPRADOS</Text>
            <View style={styles.card}>{bought.map(renderItem)}</View>
          </>
        ) : null}

        {bought.length ? (
          <Pressable style={styles.clearButton} onPress={() => persist(items.filter((item) => !item.checked))}>
            <Text style={styles.clearText}>Limpiar comprados</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 150 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backButton: { borderRadius: 13, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 9 },
  backText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 26 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 7 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  summary: { flexDirection: 'row', gap: 10, marginTop: 18 },
  summaryCell: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 14 },
  summaryNumber: { color: colors.text, fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 2 },
  section: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12, marginTop: 26, marginBottom: 9 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  check: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: '#486683', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  checkActive: { borderColor: '#347363', backgroundColor: '#153A31' },
  checkText: { color: colors.muted, fontSize: 16, fontWeight: '900' },
  checkTextActive: { color: '#8CE0C7' },
  rowCopy: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  itemBought: { color: '#8194AA', textDecorationLine: 'line-through' },
  itemMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  rowActions: { alignItems: 'flex-end', gap: 4 },
  pantryButton: { borderRadius: 9, borderWidth: 1, borderColor: '#347363', backgroundColor: '#153A31', paddingHorizontal: 8, paddingVertical: 6 },
  pantryButtonText: { color: '#8CE0C7', fontSize: 9, fontWeight: '900' },
  inPantry: { color: '#8CE0C7', fontSize: 9, fontWeight: '900' },
  removeButton: { paddingHorizontal: 7, paddingVertical: 5 },
  removeText: { color: '#8AA4C1', fontSize: 9, fontWeight: '900' },
  empty: { padding: 16 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 13 },
  emptyCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  clearButton: { marginTop: 12, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#8AA4C1', fontSize: 10, fontWeight: '900' },
});
