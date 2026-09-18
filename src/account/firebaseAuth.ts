import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { normalizeDisplayName, normalizeEmail } from './model';

export type WeekFlowAccount = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
};

function toAccount(user: FirebaseAuthTypes.User | null): WeekFlowAccount | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    emailVerified: user.emailVerified,
  };
}

function currentUserOrThrow() {
  const user = auth().currentUser;
  if (user) return user;
  const error = new Error('No current WeekFlow account') as Error & { code?: string };
  error.code = 'auth/no-current-user';
  throw error;
}

export function currentWeekFlowAccount() {
  return toAccount(auth().currentUser);
}

export function subscribeToWeekFlowAccount(listener: (account: WeekFlowAccount | null) => void) {
  return auth().onAuthStateChanged((user) => listener(toAccount(user)));
}

export async function createWeekFlowAccount(name: string, email: string, password: string) {
  const cleanName = normalizeDisplayName(name);
  const credential = await auth().createUserWithEmailAndPassword(normalizeEmail(email), password);
  await credential.user.updateProfile({ displayName: cleanName });
  return { ...toAccount(credential.user)!, displayName: cleanName };
}

export async function signInWeekFlowAccount(email: string, password: string) {
  const credential = await auth().signInWithEmailAndPassword(normalizeEmail(email), password);
  return toAccount(credential.user)!;
}

export async function signOutWeekFlowAccount() {
  await auth().signOut();
}

export async function sendWeekFlowPasswordReset(email: string) {
  await auth().sendPasswordResetEmail(normalizeEmail(email));
}

export async function sendWeekFlowVerification() {
  const user = currentUserOrThrow();
  if (!user.emailVerified) await user.sendEmailVerification();
}

export async function reloadWeekFlowAccount() {
  const user = currentUserOrThrow();
  await user.reload();
  return toAccount(auth().currentUser)!;
}

export async function updateWeekFlowAccountName(name: string) {
  const cleanName = normalizeDisplayName(name);
  const user = currentUserOrThrow();
  await user.updateProfile({ displayName: cleanName });
  return { ...toAccount(user)!, displayName: cleanName };
}

export async function deleteWeekFlowAccount() {
  await currentUserOrThrow().delete();
}
