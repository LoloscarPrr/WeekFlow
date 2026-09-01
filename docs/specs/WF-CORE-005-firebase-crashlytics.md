# WF-CORE-005 — Firebase + Crashlytics

Status: LOCKED
Owner: WeekFlow

## Problem
WeekFlow ya compila y se distribuye como APK nativa, pero todavía no tiene una integración de observabilidad de crashes en producción. El proyecto Firebase ya fue creado y existe una configuración Android para `com.weekflow.app`, pero el repositorio aún no consume esa configuración ni incluye el SDK nativo de Crashlytics.

## Desired behavior
Las builds Android standalone de WeekFlow deben inicializar Firebase nativo y Firebase Crashlytics mediante React Native Firebase, usando el `google-services.json` registrado para `com.weekflow.app`, sin romper el flujo Expo prebuild ni el build firmado existente.

## Scope
- Integrar `@react-native-firebase/app` y `@react-native-firebase/crashlytics`.
- Añadir `google-services.json` al repositorio y referenciarlo desde `expo.android.googleServicesFile`.
- Añadir los config plugins correspondientes en `app.json`.
- Mantener el flujo `npx expo prebuild --clean` usado por GitHub Actions.
- Añadir una pequeña capa de observabilidad para registrar errores no fatales desde código cuando se necesite.
- Verificar Quality y una compilación Android release mediante GitHub Actions.

## Non-goals
- No implementar Analytics, Auth, Firestore, Remote Config ni FCM en esta spec.
- No reemplazar SQLite local ni convertir Firebase en fuente de verdad de datos de usuario.
- No añadir un botón de crash visible en producción.
- No modificar lógica funcional de Ahora, Semana, Move, Food, Rest u otros módulos.

## Acceptance criteria
- [ ] AC1 — `app.json` referencia `./google-services.json` mediante `expo.android.googleServicesFile`.
- [ ] AC2 — `app.json` incluye los config plugins de React Native Firebase App y Crashlytics.
- [ ] AC3 — `package.json` incluye versiones compatibles y alineadas de `@react-native-firebase/app` y `@react-native-firebase/crashlytics`.
- [ ] AC4 — El `google-services.json` corresponde al package Android `com.weekflow.app`.
- [ ] AC5 — Existe una utilidad mínima para registrar errores no fatales en Crashlytics sin acoplar pantallas al SDK directamente.
- [ ] AC6 — `npm run quality` pasa en CI.
- [ ] AC7 — El workflow nativo logra ejecutar Expo prebuild y compilar el APK release firmado con Firebase/Crashlytics habilitado.
- [ ] AC8 — No cambia la persistencia local ni el comportamiento funcional existente de WeekFlow.

## Data / persistence impact
Ninguno. Firebase/Crashlytics se usa solo para observabilidad técnica en esta spec.

## UI / UX impact
Ninguno.

## Edge cases / regressions
- El `google-services.json` debe seguir apuntando exactamente a `com.weekflow.app`.
- El prebuild limpio no debe perder la configuración de Firebase, por eso la integración debe vivir en `app.json`/plugins y no en cambios manuales bajo `android/`.
- Una falla de Crashlytics no debe impedir el funcionamiento normal de WeekFlow.
- No debe añadirse un segundo sistema de estado o persistencia.

## Verification plan
- [ ] Revisar diff contra `main`.
- [ ] Confirmar package de Firebase y package de Expo iguales.
- [ ] Observar Quality del PR.
- [ ] Observar build Android nativo generado desde la rama/commit final o desde `main` tras merge.
- [ ] Registrar evidencia PASS/BLOCKED por criterio.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
- AC7: PENDING
- AC8: PENDING
