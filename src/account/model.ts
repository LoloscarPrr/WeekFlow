export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function displayNameValidationMessage(value: string): string | null {
  const name = normalizeDisplayName(value);
  if (name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
  if (name.length > 60) return 'Usa un nombre de hasta 60 caracteres.';
  return null;
}

export function emailValidationMessage(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Escribe tu correo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Revisa el formato del correo.';
  return null;
}

export function passwordValidationMessage(value: string): string | null {
  if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  if (value.length > 128) return 'La contraseña es demasiado larga.';
  return null;
}

export function firebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function isAuthErrorCode(error: unknown, code: string) {
  return firebaseAuthErrorCode(error) === code;
}

export function firebaseAuthErrorMessage(error: unknown): string {
  switch (firebaseAuthErrorCode(error)) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene una cuenta WeekFlow.';
    case 'auth/invalid-email':
      return 'Revisa el formato del correo.';
    case 'auth/weak-password':
      return 'Usa una contraseña de al menos 6 caracteres.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo nuevamente más tarde.';
    case 'auth/network-request-failed':
      return 'No hay conexión suficiente para completar esta acción.';
    case 'auth/operation-not-allowed':
      return 'El acceso por correo todavía no está habilitado en el servicio de WeekFlow.';
    case 'auth/configuration-not-found':
    case 'auth/app-not-authorized':
    case 'auth/invalid-api-key':
      return 'Esta versión de WeekFlow no está conectada al proyecto Firebase correcto. Actualiza la app e inténtalo nuevamente.';
    case 'auth/requires-recent-login':
      return 'Por seguridad, vuelve a iniciar sesión antes de eliminar la cuenta.';
    case 'auth/no-current-user':
      return 'No hay una cuenta activa.';
    default:
      return 'No pude completar esta acción de cuenta. Inténtalo nuevamente.';
  }
}
