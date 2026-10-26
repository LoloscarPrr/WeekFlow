# TLC Initialization Snapshot — WF-NOTIFY-005 / WF-CORE-008 (2026-10-26)

## Repository/ref, versión y baseline
- Repositorio: `LoloscarPrr/WeekFlow`; main `6efe9e3466f9912deb0ce9619090a3a419d26519`; rama `perf/wf-notify-005-idempotent-sync` reconstruida sobre el nuevo main después de detectar cambios concurrentes.
- Versión: WeekFlow `0.5.25`, Expo 57, React Native 0.86; versión Android fuente `app.json` en main.
- Quality main #40349692329 PASS; Android main v0.5.25 #40349217420 IN PROGRESS en el momento del snapshot.
- Quality WF-NOTIFY-005 (commit previo, #40349197233): PASS. QA en dispositivo: NOT RUN.

## Contexto y límites
- Blueprint Maestro v4.0 §13 y §18: notificaciones contextuales, sin spam; estabilidad y anti-feature-creep.
- AGENTS.md, TLC skill, specs WF-NOTIFY-001 / 003 / 004 consultadas.
- Código de notificaciones revisado; mantener plan, preferencias, silencio inteligente, permisos y serialización.
- `package-lock.json` ausente en main, CI con `npm install`.
- Durante el trabajo main avanzó desde `9fa0e5938d06` a `6efe9e3466f9912deb0ce9619090a3a419d26519` (WeekFlow `0.5.25`, Assistant Brain Cloud); los cambios de dependencias y pruebas se deben conservar.
- Generación inicial lockfile 0.5.24 INVALIDADA por el nuevo main. Re-generar y revalidar `npm ci` sobre `0.5.25` antes de merge.

## Decisión
- NOW WF-NOTIFY-005: reconciliación incremental con pruebas puras.
- NOW WF-CORE-008: lockfile reproducible para el nuevo main, `npm ci` en Quality/Android.
- BACKLOG: refactor SQLite, OCR clásico, UX, despliegues y nuevas funciones.
- Preservar app, firma, Android package, Firebase, Supabase y estado local.
