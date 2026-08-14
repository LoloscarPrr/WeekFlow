import { Text, View } from 'react-native';
import { moveStyles as styles } from '@/src/move/styles';

export function MoveFeedback() {
  return <View style={styles.finishCard}><Text style={styles.finishTitle}>Sesión completada</Text></View>;
}