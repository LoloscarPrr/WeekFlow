import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/src/components/Brand';
import { colors } from '@/src/theme/colors';

export default function AssistantScreen() {
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.content}><Brand /><Text style={styles.eyebrow}>ASISTENTE</Text><Text style={styles.title}>Una interfaz al Brain.</Text><Text style={styles.copy}>El asistente conversacional llegará en su fase canónica. Esta pantalla deja preparada su zona sin crear una lógica paralela al WeekFlow Brain.</Text></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.bg}, content:{padding:22}, eyebrow:{color:'#76AFFF',fontWeight:'800',letterSpacing:4,fontSize:14,marginTop:30}, title:{color:colors.text,fontWeight:'900',fontSize:40,lineHeight:46,marginTop:10}, copy:{color:colors.muted,fontSize:17,lineHeight:25,marginTop:16} });
