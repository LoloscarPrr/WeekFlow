# WeekFlow Alpha 0.5.41 — Consolidación de seguridad (WF-SEC-002)

## Mejoras
- Actualización compatible de **28 entradas del árbol de dependencias** bloqueadas en `package-lock.json`, propuesta por el escáner npm y revisada sin forzar un cambio mayor del SDK Expo ni React Native.
- Resultados del mismo inventario `npm audit --omit=dev`: de **17 paquetes señalados (11 altos)** a **11 paquetes (8 altos)**; 3 avisos altos y 3 moderados netos menos.
- Entre los avisos altos eliminados del informe figuran dependencias relacionadas con `@expo/cli`, `node-forge` y `zod`. Los hallazgos restantes **no están corregidos ni declarados explotables en Android**.
- Se mantiene una herramienta de triage que muestra dependencias afectadas y ensaya alternativas en un runner aislado, sin aplicar actualizaciones automáticamente.
- Calidad, build nativo y versión Android bajo el mismo sistema de firma y versionCode monotónico; `com.weekflow.app` no cambia.

## Sin alteraciones de producto
- No cambia almacenamiento SQLite, hábitos, horarios, Rest, Food, Move, Brain, permisos de Android, Firebase ni el consentimiento de Crashlytics.
- La instalación existente podrá actualizarse sin desinstalar si la firma Android se mantiene y la compilación firmada supera CI; el comportamiento en teléfono debe probarse físicamente.

## Pendiente
- **8 avisos altos y 3 moderados**, mayormente en los árboles de Firebase, Expo Router y Expo/fingerprint/minimatch. No degradar React Native Firebase de 26.x a 20.x ni migrar a SDK Expo 58 sin una validación separada de compatibilidad.
- Auditoría dinámica Android MASTG, confirmación de alcance de las rutas en el bundle real, verificaciones sobre un Redmi y posterior instrumentación privada de Grafana.
- **Este changelog no afirma certificación OWASP ni riesgo cero.**

Spec: WF-SEC-002
