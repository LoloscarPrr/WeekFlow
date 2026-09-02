# WF-CORE-005 — Firebase + Crashlytics

Status: DONE
Owner: WeekFlow

## Problem
WeekFlow necesitaba observabilidad nativa de crashes en producción.

## Desired behavior
Las builds Android standalone inicializan Firebase nativo y Firebase Crashlytics mediante React Native Firebase usando la configuración de `com.weekflow.app`, sin romper Expo prebuild ni el build firmado.

## Scope
- `@react-native-firebase/app` y `@react-native-firebase/crashlytics`.
- `google-services.json` referenciado desde `expo.android.googleServicesFile`.
- Config plugins en `app.json`.
- Compatibilidad con `npx expo prebuild --clean`.
- Utilidad interna para errores no fatales.

## Non-goals
- Analytics, Auth, Firestore, Remote Config o FCM.
- Cambios a SQLite o lógica funcional.

## Acceptance criteria
- [x] AC1 — `app.json` referencia `./google-services.json`.
- [x] AC2 — Config plugins de Firebase App y Crashlytics presentes.
- [x] AC3 — Dependencias RNFirebase alineadas.
- [x] AC4 — `google-services.json` corresponde a `com.weekflow.app`.
- [x] AC5 — Existe utilidad interna para errores no fatales.
- [x] AC6 — Quality pasa en CI.
- [x] AC7 — Prebuild + APK release firmado compilan con Firebase/Crashlytics.
- [x] AC8 — Sin cambios de persistencia ni comportamiento funcional.

## Data / persistence impact
Ninguno.

## UI / UX impact
Ninguno.

## Verification result
- AC1: PASS — `expo.android.googleServicesFile` apunta a `./google-services.json`.
- AC2: PASS — plugins `@react-native-firebase/app` y `@react-native-firebase/crashlytics` presentes.
- AC3: PASS — ambos paquetes usan la misma versión RNFirebase.
- AC4: PASS — package Android verificado como `com.weekflow.app`.
- AC5: PASS — `src/observability/crashlytics.ts` encapsula logging y errores no fatales.
- AC6: PASS — Quality del PR de integración terminó en success.
- AC7: PASS — Build WeekFlow Native APK #115 terminó `success`; `expo prebuild --clean`, firma y `assembleRelease` completaron correctamente.
- AC8: PASS — la integración no modifica la persistencia local ni flujos funcionales.
