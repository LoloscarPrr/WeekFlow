import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

export default function GardenScreen() {
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.content}><Brand /><Text style={styles.eyebrow}>JARDÍN</Text><Text style={styles.title}>Equilibrio sin puntajes.</Text><Text style={styles.copy}>El Jardín llegará en su fase canónica. Por ahora existe como destino de navegación, sin gamificación ni métricas inventadas.</Text></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.bg}, content:{padding:22}, eyebrow:{color:'#76AFFF',fontWeight:'800',letterSpacing:4,fontSize:14,marginTop:30}, title:{color:colors.text,fontWeight:'900',fontSize:40,lineHeight:46,marginTop:10}, copy:{color:colors.muted,fontSize:17,lineHeight:25,marginTop:16} });
