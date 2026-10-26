# WF-CORE-008 — Builds npm reproducibles

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: optimización técnica de la auditoría · 2026-10-26

## Problem
`package.json` declara dependencias sin `package-lock.json`. Tanto Quality como Android ejecutan `npm install` y pueden resolver árboles distintos entre runs, incluso con el mismo commit.

## Desired behavior
Un lockfile verificado fija las resoluciones; ambas pipelines instalan exactamente ese árbol con `npm ci` y fallan si manifiesto y lockfile divergen.

## Roadmap fit
- Phase decision: NOW
- Reason: estabilidad del núcleo y fiabilidad de versiones Android, sin cambios de producto.

## Scope
- Generar `package-lock.json` desde el `package.json` vigente con Node 22.13 en GitHub Actions.
- Verificar `npm ci` con ese lockfile en CI y pasar Quality y Android a `npm ci`.
- Retirar cualquier workflow temporal utilizado para generar el lockfile.

## Non-goals
- Actualizar versiones de paquetes intencionalmente, modificar lógica de la app o su UI.
- Reconfigurar firma, proyectos Firebase ni distribuir otra aplicación.
- Cambiar la versión pública de la app.

## Acceptance criteria
- [x] AC1 — `package-lock.json` existe, coincide con manifest y fue generado por npm.
- [ ] AC2 — `npm ci` ejecuta Quality (typecheck + tests) en PR.
- [ ] AC3 — Pipeline Android usa `npm ci` y puede generar APK/AAB firmados.
- [x] AC4 — No se modifica `package.json` fuera del script de pruebas ya alterado por WF-NOTIFY-005 ni ninguna dependencia directa.
- [x] AC5 — Workflow temporal de bootstrapping retirado del branch antes de merge.

## Data / persistence impact
None. No hay cambio en SQLite, migraciones ni estado del usuario.

## UI / UX impact
None.

## Edge cases / regressions
- Dependencia `xlsx` desde URL tarball de SheetJS: comprobar lock + `npm ci`.
- Scripts nativos/autolinking del prebuild: mantener pasos de normalización y Expo intactos.
- CI en PR debe poder instalar tras incluir el lockfile en branch.

## Verification plan
- [ ] Comprobar generación y validación `npm ci` de lockfile.
- [ ] Quality en PR con `npm ci`.
- [ ] Build Android firmado post-merge (si no es viable, BLOCKED).
- [ ] Verificar diff de `package.json` y retiro de workflow temporal.

## Verification result
- AC1: PASS — GitHub Actions bootstrap #40350557639 generó lockfile v3 para WeekFlow 0.5.25; `npm ci --ignore-scripts` completó con éxito.
- AC2: PENDING — falta Quality del PR con npm ci completo.
- AC3: BLOCKED — build Android firmado posterior a merge no ejecutado para esta rama.
- AC4: PASS — dependencias directas y versión técnica de main 0.5.25 conservadas; solo se inserta nuevo test en npm script.
- AC5: PASS — eliminado `.github/workflows/bootstrap-lockfile.yml` del branch.
- Nota: `.npmrc` fija `legacy-peer-deps=true` por conflicto de react-dom opcional y React native 19.2.3; revaluar al actualizar el stack.
