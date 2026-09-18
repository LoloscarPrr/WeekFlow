import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from '@react-native-firebase/auth';
import { normalizeDisplayName, normalizeEmail } from './model';

export type WeekFlowAccount = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
};

function toAccount(user: User | null): WeekFlowAccount | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    emailVerified: user.emailVerified,
  };
}

function currentUserOrThrow() {
  const user = getAuth().currentUser;
  if (user) return user;
  const error = new Error('No current WeekFlow account') as Error & { code?: string };
  error.code = 'auth/no-current-user';
  throw error;
}

export function currentWeekFlowAccount() {
  return toAccount(getAuth().currentUser);
}

export function subscribeToWeekFlowAccount(listener: (account: WeekFlowAccount | null) => void) {
  return onAuthStateChanged(getAuth(), (user) => listener(toAccount(user)));
}

export async function createWeekFlowAccount(name: string, email: string, password: string) {
  const cleanName = normalizeDisplayName(name);
  const credential = await createUserWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
  await updateProfile(credential.user, { displayName: cleanName });
  return { ...toAccount(credential.user)!, displayName: cleanName };
}

export async function signInWeekFlowAccount(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
  return toAccount(credential.user)!;
}

export async function signOutWeekFlowAccount() {
  await signOut(getAuth());
}

export async function sendWeekFlowPasswordReset(email: string) {
  await sendPasswordResetEmail(getAuth(), normalizeEmail(email));
}

export async function sendWeekFlowVerification() {
  const user = currentUserOrThrow();
  if (!user.emailVerified) await sendEmailVerification(user);
}

export async function reloadWeekFlowAccount() {
  const user = currentUserOrThrow();
  await reload(user);
  return toAccount(getAuth().currentUser)!;
}

export async function updateWeekFlowAccountName(name: string) {
  const cleanName = normalizeDisplayName(name);
  const user = currentUserOrThrow();
  await updateProfile(user, { displayName: cleanName });
  return { ...toAccount(getAuth().currentUser)!, displayName: cleanName };
}

export async function deleteWeekFlowAccount() {
  await deleteUser(currentUserOrThrow());
}
