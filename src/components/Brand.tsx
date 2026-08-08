import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '@/src/theme/colors';

const OFFICIAL_ICON = require('../../assets/brand/weekflow-icon.webp');

export function Brand() {
  return (
    <View style={styles.row}>
      <Image
        source={OFFICIAL_ICON}
        style={styles.logo}
        resizeMode="cover"
        accessibilityLabel="Logo oficial de WeekFlow"
      />
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
  },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  blue: { color: colors.blue },
  sub: { color: colors.muted, fontSize: 15, marginTop: -2 },
});
