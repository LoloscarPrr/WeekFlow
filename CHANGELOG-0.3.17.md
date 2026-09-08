# WeekFlow 0.3.17

## Candidata corregida para Google Play

- Declara explícitamente en el manifiesto Android que Firebase Messaging y Firebase Analytics no deben auto-inicializarse.
- Evita que las dependencias nativas de notificaciones locales registren el dispositivo en FCM al iniciar.
- Conserva la privacidad opcional de Crashlytics, la política pública y los controles incluidos en 0.3.16.
- Mantiene una sola app, el paquete `com.weekflow.app` y las compras desactivadas.

Android versionCode de fuente: `72`

Spec: WF-COMM-003
