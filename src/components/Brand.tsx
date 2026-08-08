import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

export function Brand() {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Text style={styles.wave}>⌁</Text>
        <View style={styles.dot} />
      </View>
      <View>
        <Text style={styles.name}>Week<Text style={styles.blue}>Flow</Text></Text>
        <Text style={styles.sub}>Flujo & Equilibrio</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#0B2347',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#173A70',
  },
  wave: { color: colors.blue, fontWeight: '900', fontSize: 38, marginTop: -7 },
  dot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: colors.orange,
    right: 10,
    top: 9,
  },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  blue: { color: colors.blue },
  sub: { color: colors.muted, fontSize: 15, marginTop: -2 },
});
