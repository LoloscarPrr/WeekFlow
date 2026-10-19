# WF-CORE-007 — Reparar versiones de publicación Expo para Android

Status: LOCKED
Owner: WeekFlow
Reported: 2026-10-19
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problema
Los builds de Android 0.5.12 de octubre 15 y 19 fallan en `android/settings.gradle:32` con:
`Field 'version' is required ... $.modules[12].projects[0].publication`.
`npm run quality` pasa. El parche previo busca solo `config.android.projects[].publication` y registra 0 arreglos; muchas configuraciones Expo declaran `config.android.publication` directamente. El diagnóstico anterior ejecutaba `build/index.js` como CLI y obtenía salida vacía.

## Comportamiento esperado
Antes de Gradle, detectar un bloque `publication` sin `version`, completar su versión desde el paquete instalado, identificar el módulo concreto en los logs y comprobar que el autolinking Android genere metadatos válidos. Fallar con mensaje útil si no puede resolverse, en vez de llegar al error Kotlin de Gradle.

## Roadmap fit
- Phase decision: NOW.
- Reason: bug de empaquetado bloquea distribuir la versión aprobada 0.5.12.

## Scope
- Corregir el paso de normalización y diagnóstico en el workflow Android.
- Usar el ejecutable real de Expo Autolinking (no `build/index.js`).
- Comprobar `android.publication` y `android.projects[].publication` de los módulos reales.
- Rechazar versiones de publicación vacías que queden en el resultado `resolve`.
- Añadir prueba de regresión para metadatos directos y por proyectos.

## Non-goals
- No cambiar lógica, UI, dependencias, JavaScript de negocio, SDK de Android, ni configuración de firma.
- No excluir módulos o sustituir Maven sin justificación del diagnóstico.
- No modificar `app.json`, paquete ni versión 0.5.12.
- No guardar certificados o secretos en el repositorio.

## Acceptance criteria
- AC1 — Normalizar publication.version de configuraciones Android directas y por proyectos solo cuando esté ausente, usando una versión de paquete verificada.
- AC2 — El flujo publica el nombre del módulo afectado o falla identificándolo si no lo puede reparar.
- AC3 — Preflight de autolinking Android detecta campos version aún ausentes antes de Gradle.
- AC4 — Quality y regresiones completas pasan; build Android genera APK y AAB firmados o se registra impedimento concreto.
- AC5 — La firma y el paquete `com.weekflow.app` siguen intactos; ninguna lógica de WeekFlow cambia.

## Persistencia e interfaz
No aplica. Solo scripts de CI y tests.

## Regresiones / verificación
Pruebas sobre fixtures `android.publication` y `android.projects[*].publication`; Quality del PR y workflow Android en main después de merge; comprobar artefactos APK/AAB y nombre de release real.

## Verification
Pendiente.
