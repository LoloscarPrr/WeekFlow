# WF-SEC-001 — Línea base OWASP MASVS + auditoría de dependencias

Status: LOCKED
Owner: WeekFlow
Date: 2026-11-19
Phase decision: NOW

## Problem
WeekFlow tiene comprobaciones funcionales y compilación firmada, pero carece de un control de seguridad recurrente y auditable para sus dependencias npm. Además, no existe un registro que diferencie evidencia de seguridad real de controles OWASP MASVS aún no revisados. La integración futura de observabilidad (Grafana) no debe introducir llaves dentro de APK o recopilar información personal sin consentimiento.

## Desired behavior
1. GitHub ejecuta un escaneo de vulnerabilidades de dependencias **de producción** en PRs que alteren código de dependencias/control, en push a main, semanalmente y manualmente.
2. El escaneo produce un resumen de vulnerabilidades por severidad en el reporte de GitHub Actions. Un resultado JSON inválido, error de red o formato incompatible **falla el trabajo** para no simular seguridad aprobada.
3. En esta primera fase, **vulnerabilidades detectadas generan advertencia, no un PASS de seguridad ni bloqueo automático**. Las altas/críticas requieren triage; una fase futura establecerá una política de bloqueo con excepciones revisadas.
4. Se mantiene una matriz OWASP MASVS con controles confirmados, pendientes y no evaluados; no se afirma certificación OWASP.
5. Las pruebas del parser del informe cubren resultados sin hallazgos, vulnerabilidades y errores.
6. Ninguna herramienta de telemetría o acceso secreto se incorpora a la aplicación móvil.

## Roadmap fit
- Phase decision: NOW — consolidación y observabilidad profesional de WeekFlow.
- Reason: seguridad de la cadena de dependencias y trazabilidad, sin añadir funciones ni riesgos al usuario.
- Grafana con métricas agregadas y exportación segura: BACKLOG en una intervención independiente, requiere backend/endpoint y acuerdo de privacidad; no integrar SDK Grafana en la APK.

## Scope
- `.github/workflows/security-baseline.yml`: job de análisis aislado, permisos mínimos `contents: read`.
- `scripts/security-audit-report.cjs`: parseo estricto y resumen sin secretos.
- `tests/security-audit-report.test.cjs`: tests puros.
- `docs/security/owasp-masvs-baseline.md`: matriz de evaluación por los ocho grupos MASVS.
- Documentación TLC y especificación.

## Non-goals
- No auditoría dinámica Android, análisis de APK (MASTG), pentest, pinning TLS, cifrado SQLite o renovación de dependencias en esta fase.
- No sustitución de Crashlytics ni conexión real a Grafana sin infraestructura/autorizaciones.
- No actualización de versión, permisos, firma Android, token de GitHub, esquema SQLite ni APIs de WeekFlow.

## Acceptance criteria
- [ ] AC1 — El workflow ejecuta escaneo en PR de dependencias/seguridad, push de main, agenda semanal y manual, sin acceso de escritura ni secretos.
- [ ] AC2 — El reporte distingue altas/críticas de hallazgos leves y **no afirma seguridad garantizada**; muestra conteos, no detalles sensibles.
- [ ] AC3 — Escaneo inválido o fallido no produce resultado verde; los hallazgos de dependencias son informativos en el primer inventario.
- [ ] AC4 — Pruebas con JSON vacío/alto/crítico/error cubren fail-closed del parser.
- [ ] AC5 — Matriz MASVS cubre STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE y PRIVACY con evidencia vs pendientes; Grafana no recibe datos por defecto.
- [ ] AC6 — No cambian APK, preferencias, telemetría, package version, SQLite, permisos, ni claves.
- [ ] AC7 — Quality del PR pasa; workflow de seguridad concluye o documenta explícitamente hallazgos/bloqueo. Las pruebas dinámicas y observabilidad externa permanecen pendientes.

## Data and persistence
Ningún cambio de datos, SQLite, respaldo o migraciones. Solo lectura del manifiesto y árbol de dependencias npm desde GitHub Actions.

## UI/UX
Ningún cambio dentro de la APK ni indicador de certificación; nuevo resumen GitHub Actions en el flujo de desarrollo.

## Edge cases and regressions
- npm audit devuelve exit code 1 con vulnerabilidades válidas: informe verde **como ejecución**, con warning claro de que existe riesgo no resuelto.
- npm audit devuelve un JSON de error, vacío o incompleto: job FAIL, no enmascarar caída de servicio.
- Ejecutar con `pull_request` sin secretos, no publicar claves ni datos personales.
- Compatibilidad con Quality y `Build WeekFlow Native Android`.
- Pendiente revisión manual de APK/restricciones Android, autenticación Firebase y flujo remoto IA.

## Verification
- [ ] Node tests de parser.
- [ ] GitHub Quality de PR.
- [ ] GitHub Security baseline de PR / ejecución programada.
- [ ] Revision de cambios acotada a CI y documentación, sin APK nueva.
- [ ] Evidencia PASS/BLOCKED por criterio.

## Verification results
- AC1–AC7: PENDING
