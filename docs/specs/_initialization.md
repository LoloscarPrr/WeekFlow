# TLC Initialization Snapshot — WF-BRAIN-019 (2026-11-19)

## Repository and baseline
- Repositorio: `LoloscarPrr/WeekFlow`; base `main` SHA `9c0278b7e6b37a06e597edc08d80096235870a58`; rama de trabajo `feature/wf-brain-019-previous-sunday-recovery`.
- Versión técnica verificada: `app.json` y `package.json` = **0.5.39 Alpha**; `com.weekflow.app` y `app.json` versionCode 114. El workflow Android calcula un versionCode creciente al compilar; no modificar firma ni paquete.
- Expo SDK 57, React Native 0.86; estado persistente local-first/SQLite.
- Blueprint Maestro v4.0 (2026-09-30): fuente de verdad, Core coherente, prioridad del descanso nocturno; fase de consolidación aprobada por el usuario, sin abrir módulos.
- Reglas leídas: `AGENTS.md`, `.agents/skills/tlc-spec-driven/SKILL.md`, `docs/specs/_template.md`.
- Especificaciones relacionadas: `WF-WEEK-014` (dos semanas), `WF-BRAIN-013` (plan semanal), `WF-BRAIN-014` (Move autónomo), `WF-BRAIN-015` (splits Move). Nueva: `WF-BRAIN-019`.

## Baseline de calidad disponible
- `Quality` en main SHA `9c0278b`: **PASS** (GitHub Actions, 2026-11-17).
- `Build WeekFlow Native Android` mismo SHA: **PASS** (GitHub Actions, 2026-11-17).
- Ejecución local de TypeScript/tests y pruebas reales de actualización en Redmi: **UNAVAILABLE/NOT RUN** en esta sesión.
- No asumir que `README.md` describe versión actual: quedó en 0.2.2 y necesita otra intervención documental.

## Problema reproducible por inspección
- `src/brain/weeklyPlanner.ts` ya utiliza `previousWeek` para reservar trabajo nocturno del domingo previo en `workingIntervals`, pero cae erróneamente en `week` si no existe semana anterior.
- El cálculo `recoveryDates` recorre domingo previo con `input.week` en lugar de `input.previousWeek`. Puede generar o eliminar indebidamente protección de recuperación del lunes.
- `proposeWeeklyPlan` recibe la semana anterior desde Semana, Asistente y persistencia; el problema se concentra en el motor puro.

## Restricciones y siguiente especificación
- Mantener `weekOffset` 0/1, horarios nocturnos, descansos, citas, hábitos, Move y preview/confirmación existentes.
- No cambiar datos, tablas SQLite, notificaciones, onboarding, firmas ni versiones en este arreglo.
- Spec elegida: `WF-BRAIN-019 — Recuperación correcta del domingo previo al cambiar de semana`, decisión **NOW**.
