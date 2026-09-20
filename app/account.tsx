import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Brand } from '@/src/components/Brand';
import {
  createWeekFlowAccount,
  currentWeekFlowAccount,
  deleteWeekFlowAccount,
  reloadWeekFlowAccount,
  sendWeekFlowPasswordReset,
  sendWeekFlowVerification,
  signInWeekFlowAccount,
  signOutWeekFlowAccount,
  subscribeToWeekFlowAccount,
  updateWeekFlowAccountName,
  type WeekFlowAccount,
} from '@/src/account/firebaseAuth';
import {
  displayNameValidationMessage,
  emailValidationMessage,
  firebaseAuthErrorMessage,
  isAuthErrorCode,
  normalizeDisplayName,
  passwordValidationMessage,
} from '@/src/account/model';
import { loadUserProfile, saveUserProfile } from '@/src/state/persistence';
import { colors } from '@/src/theme/colors';

type AuthMode = 'create' | 'signin';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const initialProfile = loadUserProfile();
  const [account, setAccount] = useState<WeekFlowAccount | null>(() => {
    try { return currentWeekFlowAccount(); } catch { return null; }
  });
  const [mode, setMode] = useState<AuthMode>('create');
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToWeekFlowAccount((next) => {
        setAccount(next);
        if (next?.email) setEmail(next.email);
        if (next?.displayName) {
          setName(next.displayName);
          const current = loadUserProfile();
          if (current.name !== next.displayName) saveUserProfile({ ...current, name: next.displayName });
        }
      });
    } catch (error) {
      setErrorText(firebaseAuthErrorMessage(error));
    }
    return unsubscribe;
  }, []);

  function clearMessages() {
    setFeedback(null);
    setErrorText(null);
  }

  async function run(action: () => Promise<void>) {
    if (busy) return;
    clearMessages();
    setBusy(true);
    try { await action(); }
    catch (error) { setErrorText(firebaseAuthErrorMessage(error)); }
    finally { setBusy(false); }
  }

  async function submitAuth() {
    const issue = (mode === 'create' ? displayNameValidationMessage(name) : null)
      ?? emailValidationMessage(email)
      ?? passwordValidationMessage(password);
    if (issue) {
      setErrorText(issue);
      setFeedback(null);
      return;
    }

    await run(async () => {
      if (mode === 'create') {
        const next = await createWeekFlowAccount(name, email, password);
        const cleanName = normalizeDisplayName(name);
        saveUserProfile({ ...loadUserProfile(), name: cleanName });
        setAccount(next);
        setName(cleanName);
        setFeedback('Cuenta creada. Puedes verificar tu correo desde esta pantalla.');
      } else {
        const next = await signInWeekFlowAccount(email, password);
        const remoteName = next.displayName || loadUserProfile().name;
        if (remoteName) {
          saveUserProfile({ ...loadUserProfile(), name: remoteName });
          setName(remoteName);
        }
        setAccount(next);
        setFeedback('Sesión iniciada. Tus datos de planificación siguen guardados localmente.');
      }
      setPassword('');
    });
  }

  async function resetPassword() {
    const issue = emailValidationMessage(email);
    if (issue) {
      setErrorText(issue);
      setFeedback(null);
      return;
    }
    if (busy) return;
    clearMessages();
    setBusy(true);
    try {
      await sendWeekFlowPasswordReset(email);
      setFeedback('Si existe una cuenta para ese correo, recibirás instrucciones para recuperar el acceso.');
    } catch (error) {
      if (isAuthErrorCode(error, 'auth/user-not-found')) {
        setFeedback('Si existe una cuenta para ese correo, recibirás instrucciones para recuperar el acceso.');
      } else {
        setErrorText(firebaseAuthErrorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    const issue = displayNameValidationMessage(name);
    if (issue) {
      setErrorText(issue);
      setFeedback(null);
      return;
    }
    await run(async () => {
      const cleanName = normalizeDisplayName(name);
      const next = await updateWeekFlowAccountName(cleanName);
      saveUserProfile({ ...loadUserProfile(), name: cleanName });
      setName(cleanName);
      setAccount(next);
      setEditingName(false);
      setFeedback('Nombre actualizado.');
    });
  }

  async function verifyEmail() {
    await run(async () => {
      await sendWeekFlowVerification();
      setFeedback('Te envié un correo de verificación. Luego toca “Revisar estado”.');
    });
  }

  async function refreshAccount() {
    await run(async () => {
      const next = await reloadWeekFlowAccount();
      setAccount(next);
      setFeedback(next.emailVerified ? 'Correo verificado.' : 'El correo todavía aparece pendiente de verificación.');
    });
  }

  async function signOut() {
    await run(async () => {
      await signOutWeekFlowAccount();
      setAccount(null);
      setPassword('');
      setEditingName(false);
      setFeedback('Sesión cerrada. Tu semana y registros locales siguen en este teléfono.');
    });
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta WeekFlow',
      'Se eliminará tu identidad de acceso en Firebase. Tu semana y registros locales permanecerán en este teléfono.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: () => {
            void run(async () => {
              await deleteWeekFlowAccount();
              setAccount(null);
              setPassword('');
              setEditingName(false);
              setFeedback('Cuenta eliminada. Los datos locales de WeekFlow permanecen en este teléfono.');
            });
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
        >
          <View style={styles.top}>
            <Brand />
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backText}>Volver</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>CUENTA WEEKFLOW</Text>
            <Text style={styles.title}>{account ? 'Tu identidad, bajo tu control.' : 'Tu cuenta, cuando la necesites.'}</Text>
            <Text style={styles.intro}>
              La cuenta es opcional. Ahora, Semana y tus registros siguen funcionando sin iniciar sesión.
            </Text>
          </View>

          <View style={styles.localCard}>
            <Text style={styles.localTitle}>Local primero</Text>
            <Text style={styles.localBody}>
              Esta versión no sube tu horario, comidas, rutinas ni descanso. La cuenta prepara recuperación y futura sincronización opcional.
            </Text>
          </View>

          {account ? (
            <View style={styles.stack}>
              <View style={styles.card}>
                <View style={styles.accountHead}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(account.displayName || name || account.email || 'W').slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.accountCopy}>
                    <Text style={styles.accountName}>{account.displayName || name || 'Cuenta WeekFlow'}</Text>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  </View>
                  <Pressable
                    style={styles.editNameButton}
                    disabled={busy}
                    onPress={() => {
                      clearMessages();
                      setName(account.displayName || loadUserProfile().name || name);
                      setEditingName(true);
                    }}
                  >
                    <Text style={styles.editNameText}>Editar nombre</Text>
                  </Pressable>
                </View>
                <View style={[styles.statusPill, account.emailVerified ? styles.statusOk : styles.statusPending]}>
                  <Text style={styles.statusText}>{account.emailVerified ? 'CORREO VERIFICADO' : 'VERIFICACIÓN PENDIENTE'}</Text>
                </View>
                {!account.emailVerified ? (
                  <View style={styles.row}>
                    <Pressable style={styles.secondaryButton} disabled={busy} onPress={verifyEmail}>
                      <Text style={styles.secondaryText}>Enviar verificación</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} disabled={busy} onPress={refreshAccount}>
                      <Text style={styles.secondaryText}>Revisar estado</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {editingName ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Editar nombre</Text>
                  <Text style={styles.cardBody}>Cámbialo solo si quieres que WeekFlow te muestre otro nombre.</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={60}
                    placeholder="Tu nombre"
                    placeholderTextColor="#60728E"
                    style={styles.input}
                    editable={!busy}
                    autoFocus
                  />
                  <Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={saveName}>
                    <Text style={styles.primaryText}>Guardar cambio</Text>
                  </Pressable>
                  <Pressable
                    style={styles.linkButton}
                    disabled={busy}
                    onPress={() => {
                      clearMessages();
                      setName(account.displayName || loadUserProfile().name || '');
                      setEditingName(false);
                    }}
                  >
                    <Text style={styles.linkText}>Cancelar</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sesión</Text>
                <Text style={styles.cardBody}>Cerrar sesión no borra la planificación ni los registros guardados en este dispositivo.</Text>
                <Pressable style={styles.secondaryWide} disabled={busy} onPress={signOut}>
                  <Text style={styles.secondaryWideText}>Cerrar sesión</Text>
                </Pressable>
              </View>

              <View style={styles.dangerCard}>
                <Text style={styles.dangerTitle}>Eliminar cuenta</Text>
                <Text style={styles.dangerBody}>Elimina tu identidad de acceso. Firebase puede pedirte iniciar sesión otra vez antes de permitirlo.</Text>
                <Pressable style={styles.dangerButton} disabled={busy} onPress={confirmDeleteAccount}>
                  <Text style={styles.dangerButtonText}>Eliminar mi cuenta</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.stack}>
              <View style={styles.tabs}>
                <Pressable style={[styles.tab, mode === 'create' && styles.tabActive]} onPress={() => { setMode('create'); clearMessages(); }}>
                  <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Crear cuenta</Text>
                </Pressable>
                <Pressable style={[styles.tab, mode === 'signin' && styles.tabActive]} onPress={() => { setMode('signin'); clearMessages(); }}>
                  <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Iniciar sesión</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                {mode === 'create' ? (
                  <>
                    <Text style={styles.label}>NOMBRE</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={60}
                      placeholder="Cómo quieres que te llame WeekFlow"
                      placeholderTextColor="#60728E"
                      style={styles.input}
                      editable={!busy}
                    />
                  </>
                ) : null}

                <Text style={styles.label}>CORREO</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="tu@correo.cl"
                  placeholderTextColor="#60728E"
                  style={styles.input}
                  editable={!busy}
                />

                <Text style={styles.label}>CONTRASEÑA</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType={mode === 'create' ? 'newPassword' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#60728E"
                  style={styles.input}
                  editable={!busy}
                  onSubmitEditing={submitAuth}
                />

                <Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={submitAuth}>
                  <Text style={styles.primaryText}>{mode === 'create' ? 'Crear mi cuenta' : 'Entrar a mi cuenta'}</Text>
                </Pressable>

                <Pressable style={styles.linkButton} disabled={busy} onPress={resetPassword}>
                  <Text style={styles.linkText}>Olvidé mi contraseña</Text>
                </Pressable>
              </View>
            </View>
          )}

          {errorText ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorText}</Text></View> : null}
          {feedback ? <View style={styles.feedbackBox}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  back: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  backText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  hero: { marginTop: 24 },
  eyebrow: { color: '#76AFFF', fontWeight: '800', letterSpacing: 3, fontSize: 12 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 7 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  localCard: { marginTop: 16, backgroundColor: '#0C2947', borderWidth: 1, borderColor: '#285F96', borderRadius: 20, padding: 16 },
  localTitle: { color: '#8FC2FF', fontWeight: '900', fontSize: 14 },
  localBody: { color: '#BDD1E8', fontSize: 12, lineHeight: 18, marginTop: 5 },
  stack: { gap: 12, marginTop: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 17 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  accountHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#143867', borderWidth: 1, borderColor: colors.blue },
  avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 19 },
  accountCopy: { flex: 1 },
  editNameButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 },
  editNameText: { color: '#8FC2FF', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  accountName: { color: colors.text, fontWeight: '900', fontSize: 18 },
  accountEmail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 14, borderWidth: 1 },
  statusOk: { backgroundColor: '#10382E', borderColor: '#347C68' },
  statusPending: { backgroundColor: '#392E14', borderColor: '#80662D' },
  statusText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  secondaryText: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  label: { color: '#76AFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 11, marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: '#28558B', paddingHorizontal: 13, color: colors.text, fontSize: 14 },
  primaryButton: { marginTop: 14, minHeight: 50, borderRadius: 15, backgroundColor: colors.blueStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  secondaryWide: { marginTop: 14, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryWideText: { color: colors.text, fontWeight: '900', fontSize: 14 },
  linkButton: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  linkText: { color: '#76AFFF', fontSize: 12, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 8, padding: 4, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.line },
  tab: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#173C6C' },
  tabText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  tabTextActive: { color: '#FFFFFF' },
  dangerCard: { backgroundColor: '#251416', borderWidth: 1, borderColor: '#673039', borderRadius: 22, padding: 17 },
  dangerTitle: { color: '#FFB4BC', fontSize: 16, fontWeight: '900' },
  dangerBody: { color: '#D8A7AD', fontSize: 12, lineHeight: 18, marginTop: 5 },
  dangerButton: { marginTop: 13, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#98505A', alignItems: 'center', justifyContent: 'center' },
  dangerButtonText: { color: '#FFC6CC', fontWeight: '900', fontSize: 13 },
  errorBox: { marginTop: 12, padding: 13, borderRadius: 14, backgroundColor: '#30181C', borderWidth: 1, borderColor: '#7E3A45' },
  errorText: { color: '#FFC2C8', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  feedbackBox: { marginTop: 12, padding: 13, borderRadius: 14, backgroundColor: '#10362F', borderWidth: 1, borderColor: '#32715F' },
  feedbackText: { color: '#B9E9DB', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
