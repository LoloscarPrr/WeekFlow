import {
  displayNameValidationMessage,
  emailValidationMessage,
  firebaseAuthErrorMessage,
  isAuthErrorCode,
  normalizeDisplayName,
  normalizeEmail,
  passwordValidationMessage,
} from '../src/account/model';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

equal(normalizeEmail('  Oscar@Example.COM  '), 'oscar@example.com', 'normaliza correo');
equal(normalizeDisplayName('  Oscar   Urrutia  '), 'Oscar Urrutia', 'normaliza nombre');
equal(displayNameValidationMessage(''), 'Escribe un nombre de al menos 2 caracteres.', 'rechaza nombre vacío');
equal(displayNameValidationMessage('O'), 'Escribe un nombre de al menos 2 caracteres.', 'rechaza nombre corto');
equal(displayNameValidationMessage('Oscar'), null, 'acepta nombre válido');
equal(displayNameValidationMessage('x'.repeat(61)), 'Usa un nombre de hasta 60 caracteres.', 'limita nombre');
equal(emailValidationMessage(''), 'Escribe tu correo.', 'rechaza correo vacío');
equal(emailValidationMessage('oscar@'), 'Revisa el formato del correo.', 'rechaza correo inválido');
equal(emailValidationMessage('oscar@example.com'), null, 'acepta correo válido');
equal(passwordValidationMessage('12345'), 'La contraseña debe tener al menos 6 caracteres.', 'rechaza contraseña corta');
equal(passwordValidationMessage('123456'), null, 'acepta contraseña mínima');
equal(passwordValidationMessage('x'.repeat(129)), 'La contraseña es demasiado larga.', 'limita contraseña');
equal(firebaseAuthErrorMessage({ code: 'auth/email-already-in-use' }), 'Ese correo ya tiene una cuenta WeekFlow.', 'correo duplicado');
equal(firebaseAuthErrorMessage({ code: 'auth/invalid-credential' }), 'Correo o contraseña incorrectos.', 'credenciales');
equal(firebaseAuthErrorMessage({ code: 'auth/network-request-failed' }), 'No hay conexión suficiente para completar esta acción.', 'red');
equal(firebaseAuthErrorMessage({ code: 'auth/operation-not-allowed' }), 'El acceso por correo todavía no está habilitado en el servicio de WeekFlow.', 'provider');
equal(firebaseAuthErrorMessage({ code: 'auth/configuration-not-found' }), 'Esta versión de WeekFlow no está conectada al proyecto Firebase correcto. Actualiza la app e inténtalo nuevamente.', 'configuración Firebase incorrecta');
equal(firebaseAuthErrorMessage({ code: 'auth/requires-recent-login' }), 'Por seguridad, vuelve a iniciar sesión antes de eliminar la cuenta.', 'reauth');
equal(firebaseAuthErrorMessage(new Error('raw')), 'No pude completar esta acción de cuenta. Inténtalo nuevamente.', 'fallback');
equal(isAuthErrorCode({ code: 'auth/user-not-found' }, 'auth/user-not-found'), true, 'detecta código');
equal(isAuthErrorCode({ code: 'auth/invalid-email' }, 'auth/user-not-found'), false, 'no confunde códigos');

console.log('Account auth model regression tests passed.');
