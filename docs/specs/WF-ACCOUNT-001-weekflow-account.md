# WF-ACCOUNT-001 — Cuenta WeekFlow con Firebase Auth

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 18-09-2026
Blueprint mapping: UserProfile, ONB-01, arquitectura backend intercambiable, track Free/Premium

## Problem
WeekFlow ya tiene un perfil local mínimo, Firebase App/Crashlytics y una arquitectura comercial preparada para sincronización futura, pero no existe identidad de usuario: no se puede crear cuenta, iniciar sesión, recuperar acceso ni asociar posteriormente respaldo/sincronización o entitlements a una persona.

La app tampoco puede exigir una cuenta sin contradecir su núcleo offline-first. La identidad debe añadirse como una capa opcional y reversible sobre los datos locales existentes.

## Desired behavior
- WeekFlow permite crear una cuenta propia con nombre, correo y contraseña.
- Una persona puede iniciar y cerrar sesión, recuperar contraseña y verificar su correo.
- El nombre visible forma parte del `UserProfile` local y se refleja en Firebase Auth cuando existe sesión.
- La cuenta es opcional: Ahora, Semana, Move, Food, Rest y registros locales siguen funcionando sin sesión e incluso sin internet.
- Cerrar sesión no borra datos locales.
- Eliminar la cuenta elimina la identidad de Firebase Auth; los datos locales del teléfono se conservan y la UI lo explica antes de confirmar.
- La privacidad diferencia claramente identidad remota (correo, UID y nombre) de planificación local.
- La arquitectura queda preparada para una spec posterior de respaldo/sincronización, pero esta spec no sube jornadas ni registros personales.

## Scope
- Añadir `@react-native-firebase/auth`.
- Crear capa de cuenta bajo `src/account/`:
  - normalización/validación de nombre, correo y contraseña;
  - traducción estable de errores Firebase a mensajes de WeekFlow;
  - operaciones create/sign-in/sign-out/reset/verify/update/delete.
- Añadir `app/account.tsx` con:
  - Crear cuenta;
  - Iniciar sesión;
  - Recuperar contraseña;
  - Reenviar/verificar correo cuando corresponda;
  - Editar nombre;
  - Cerrar sesión;
  - Eliminar cuenta con confirmación.
- Añadir acceso “Cuenta WeekFlow” desde Asistente.
- Extender `UserProfile` con `name` manteniendo migración backward-compatible.
- Actualizar `app/privacy.tsx` y `PRIVACY_POLICY.md`.
- Añadir regresiones de validación/mapeo de errores y migración legacy.
- Subir versión pública a `0.3.20` y documentar el cambio.
- Ejecutar Quality y build Android release.

## Non-goals
- No Firestore ni subida de Semana, Food, Move, Rest, DailyState o archivos.
- No sincronización entre dispositivos en esta spec.
- No Google Sign-In, Apple, teléfono, OAuth social ni passkeys.
- No Google Play Billing, compra/restauración ni validación remota de Premium.
- No paywall ni bloqueo del Core por falta de cuenta.
- No onboarding completo 0.8.x; solo la base de identidad que ese onboarding podrá reutilizar.
- No borrado automático de la base local al cerrar sesión o eliminar la identidad.
- No Analytics ni publicidad.

## Acceptance criteria
- [ ] AC1 — Asistente expone “Cuenta WeekFlow” y abre una pantalla propia, sin agregar una sexta zona a la navegación principal.
- [ ] AC2 — Sin sesión, la pantalla permite crear cuenta con nombre/correo/contraseña e iniciar sesión con correo/contraseña, con validación local clara antes de llamar a Firebase.
- [ ] AC3 — Recuperación de contraseña funciona para un correo válido y la UI no revela información sensible adicional.
- [ ] AC4 — Con sesión activa se muestran nombre, correo y estado de verificación; se puede reenviar verificación y actualizar el nombre.
- [ ] AC5 — Cerrar sesión vuelve al estado firmado-out sin borrar ni modificar Semana, DailyState, Food, Move u otros datos locales.
- [ ] AC6 — Eliminar cuenta requiere confirmación explícita, intenta borrar la identidad Firebase y maneja `requires-recent-login` con un mensaje accionable; los datos locales permanecen.
- [ ] AC7 — `UserProfile.name` se persiste localmente y perfiles legacy que solo tengan `scheduleName` migran sin pérdida ni crash.
- [ ] AC8 — Los flujos nucleares de WeekFlow siguen disponibles sin sesión; RootLayout no redirige obligatoriamente a login.
- [ ] AC9 — La pantalla usa scroll + KeyboardAvoidingView y mantiene acciones utilizables con teclado en Android.
- [ ] AC10 — Privacidad en app y política pública dejan de afirmar “no crea cuenta” y describen con precisión Firebase Authentication, datos de identidad y que la planificación sigue local en esta spec.
- [ ] AC11 — La dependencia Auth se integra al prebuild Android sin cambiar package, firma ni arquitectura single-app; billing continúa desactivado.
- [ ] AC12 — Regresiones cubren validación, errores Auth y migración legacy; TypeScript/Quality pasan.
- [ ] AC13 — Build Android release genera APK y AAB firmados para `0.3.20`.
- [ ] AC14 — Estado de Email/Password en Firebase Console y prueba física create/sign-in/reset se registran como PASS o BLOCKED/UNAVAILABLE, nunca se asumen.

## Data / persistence impact
- `UserProfile` suma `name: string` dentro de la misma entrada SQLite existente. La migración rellena `''` para datos legacy; no requiere cambio de esquema SQLite.
- Firebase Authentication almacena la identidad de cuenta: UID, correo, nombre de perfil y metadatos propios del proveedor.
- Contraseñas no se almacenan en SQLite ni en código WeekFlow.
- Jornadas, estados diarios, Food, Move, Rest y otros registros siguen locales en esta spec.

## UI / UX impact
- Asistente gana una tarjeta compacta “Cuenta WeekFlow”.
- Nueva pantalla dedicada coherente con la UI navy/azul actual.
- Crear/iniciar sesión se presenta como opcional, no como muro de entrada.
- La pantalla explica “Tus datos de planificación siguen en este teléfono” mientras no exista sincronización.
- Errores técnicos de Firebase se traducen a mensajes comprensibles.
- Acciones destructivas se separan visualmente y requieren confirmación.

## Edge cases / regressions
- Correo con mayúsculas/espacios se normaliza.
- Nombre vacío o demasiado largo no se guarda.
- Contraseña menor a 6 caracteres se bloquea localmente.
- Correo inválido se bloquea localmente.
- `auth/email-already-in-use`, `wrong-password/invalid-credential`, `too-many-requests`, `network-request-failed`, `operation-not-allowed` tienen copy estable.
- Firebase Auth nativo no disponible/configurado no debe tumbar toda la app; el error queda contenido en Cuenta.
- Usuario sin displayName remoto puede usar el nombre local.
- Cerrar sesión con red irregular no borra nada local.
- Eliminar cuenta con credenciales antiguas pide volver a iniciar sesión.
- Perfil SQLite legacy conserva `scheduleName`.
- La política de privacidad no debe afirmar que horarios/registros se sincronizan todavía.

## Verification plan
- [ ] Revisar cambios de perfil/migración, Auth boundary, UI y privacidad.
- [ ] Ejecutar `npm run quality` en PR.
- [ ] Confirmar regresiones de cuenta y perfiles legacy.
- [ ] Confirmar que el RootLayout no impone sesión.
- [ ] Confirmar `billingEnabled === false`.
- [ ] Ejecutar Android release build tras merge.
- [ ] Confirmar APK + AAB y paquete `com.weekflow.app`.
- [ ] Registrar como UNAVAILABLE/BLOCKED cualquier paso que dependa del Firebase Console o de teléfono físico.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
- AC7: PENDING
- AC8: PENDING
- AC9: PENDING
- AC10: PENDING
- AC11: PENDING
- AC12: PENDING
- AC13: PENDING
- AC14: PENDING
