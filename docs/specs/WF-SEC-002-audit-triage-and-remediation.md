# WF-SEC-002 — Triage de advisories npm y remediación compatible con Android

Status: VERIFYING
Owner: WeekFlow
Date: 2026-11-24
Phase decision: NOW — fase 3.1 aprobada de consolidación de seguridad
Blueprint: WeekFlow Maestro v4.0 — estabilidad Core/privacidad y release Android compatible

## Problem
El escaneo `npm audit --omit=dev` en main reporta **17** advisories (11 altos/críticos). El flujo existente muestra solo conteos: aún se desconocen las bibliotecas afectadas, los caminos transitivos y las correcciones compatibles. Un `npm audit fix` aplicado ciegamente puede romper Expo SDK 57, React Native 0.86, módulos nativos o la instalación sobre la app existente.

## Desired behavior
Recuperar el informe real de vulnerabilidades, clasificar causas/alcance/posibles remediaciones; evaluar una propuesta automática de lockfile **en un entorno aislado**, con tests y la APK intacta hasta aprobar cambios. Aplicar únicamente correcciones justificadas y comprobadas; documentar las que no tienen arreglo seguro. Conservar el baseline semanal y diferenciación entre éxito de escaneo y riesgo pendiente.

## Scope
- Script `scripts/security-triage.cjs` para resumir package/severity/range/via/fixAvailable de un `npm audit --omit=dev --json` sin imprimir secretos ni payloads del usuario.
- `.github/workflows/security-triage.yml` para obtener evidencia audit y proponer lockfile candidate mediante `npm audit fix --package-lock-only --ignore-scripts`, sin escribir en GitHub automáticamente.
- Tests de parser, matriz explicativa de advisories concretos, y **si es viable** actualizaciones acotadas de package-lock/package.json validadas con `npm ci`, Quality y build Android.
- Analizar los límites nativos/metro de cada dependencia. PR con prueba y revisión antes de merge.

## Non-goals
- No saltos principales Expo/React Native, no overrides nativos especulativos.
- No declarar 'OWASP certificado' ni afirmar 17 vulnerabilidades explotables en Android.
- No token/credenciales ni datos personales de usuarios en reportes.
- No cambios en esquemas SQLite, ID Android, permisos, Firebase, Grafana o UX.
- No publicar una APK nueva si los cambios son solo de investigación.

## Acceptance criteria
1. El informe detalla paquete/severidad/rango afectado/remedio disponible y agrupa causas sin confundir total con riesgo explotable; demuestra concordancia con el baseline.
2. Un candidato de fix se genera en CI de manera aislada sin escrituras automáticas al repositorio y queda disponible para revisión; error de auditoría o candidato se distingue de un resultado limpio.
3. Tests del parser robustos a advisories transitivos, `via` mixto, formatos incompletos, y sin secretos.
4. Si se adopta lockfile nuevo, se justifica qué paquetes cambiaron y `npm ci` + `Quality` pasan. Si no, se marca como BLOCKED y no se altera la app.
5. Se documentan hallazgos restantes y mitigaciones/restricciones junto a los avisos compatibles; nunca ocultar riesgo de CI.
6. Si se modifican dependencias de la APK, generar signed Android release con paquete/firma/versionCode monotónico e indicar prueba física pendiente.
7. PR Quality y Security audit pasan o se registra falla; integración en main solo tras evidencia y alcance claro.

## Persistence / app impact
Triage en CI solamente no modifica APK/SQLite; transitive lock updates si los hubiere pueden afectar comportamiento nativo y exigen build/QA Android. Conservar release `0.5.40` hasta que un cambio en el binario exija nueva versión.

## UI / privacy
Sin interfaz nueva. No enviar PII, horarios ni datos Crashlytics a un backend nuevo. Solo avisos públicos de dependencias.

## Edge cases
- `npm audit` exit code 1 con JSON válido y hallazgos no equivale a error de herramienta.
- `npm audit fix` exit code no cero si quedan advisories; el candidato puede ser válido sin dar un resultado libre de riesgo.
- Candidato no compatible con Expo o con prueba native: revertir/no adoptar.
- Paquetes `dev` excluidos por el audit inicial no implican seguridad de toolchain ni Android.

## Verification plan
- Parser unit regressions, CI triage artifact, diff de candidata y post-audit.
- `npm ci`, TypeScript/tests, Metro y Android release si procede.
- Comparar conteos pre/post y explicar lo no solucionado.
- Actualizar AC como PASS/BLOCKED con enlaces a runs.

## Verification
- **AC1 PASS** — first CI #45330965937 inspected 17 packages (11 high), actual names/severity/via/fix availability; explains grouped underlying cause and Android-reachability uncertainty.
- **AC2 PASS** — read-only GitHub Actions PR `Security triage` produced ephemeral original/candidate lockfile artifact; no automatic source write or merge. Candidate reviewed before explicit GitHub source edit.
- **AC3 PASS** — strict triage parser tests passed in #45330965937 and subsequent runs. Separates malformed audit JSON and valid findings.
- **AC4 PASS provisional** — adopted only the first controlled 28 lockfile entry differences, no SDK Expo or RN major changes; candidate's Quality `npm ci`, TypeScript/regressions, Metro #45331316753 PASS, and security scan #45331316717 PASS. Final version 0.5.41 Quality still needs same checks on final head before merge.
- **AC5 PASS** — `docs/security/WF-SEC-002-triage-2026-11-24.md` records residual 11 package advisories (8 high / 3 moderate), groups Firebase / Router / Expo, explains why suggested major downgrade/upgrades or overrides were rejected.
- **AC6 PENDING** — Android package, signing and monotonic versionCode remain configured; 0.5.41 signed release build on main after merge; physical upgrade on Redmi requires user.
- **AC7 PENDING FINAL CI** — PR checks must be green on final docs/spec head before merge. Android native CI after merge required.
- **Not validated**: whether JS Firebase/Router dependencies are reachable in Android bundle, full mobile MASTG, physical real-device behavior, Grafana connection; no OWASP certification claim.

Security baseline counts from the CI environment can change with newly published advisories; these results are a dated snapshot, not a promise of zero flaws.

