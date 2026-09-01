# WeekFlow Alpha 0.3.13

## Firebase / estabilidad
- Integra Firebase nativo para Android mediante React Native Firebase.
- Añade Firebase Crashlytics para capturar crashes de builds standalone.
- Añade una capa interna para registrar errores no fatales sin acoplar pantallas al SDK.
- La configuración Firebase usa el package `com.weekflow.app` y sobrevive a `expo prebuild --clean`.

## Sin cambios de producto
- No cambia datos locales, planificación, módulos ni comportamiento visible.
- No añade Analytics, Auth, Firestore ni sincronización en esta versión.

Spec: WF-CORE-005
