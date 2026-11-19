# WF-BRAIN-019 — Recuperación correcta del domingo previo al cambiar de semana

Status: LOCKED
Owner: WeekFlow
Base: main @ 9c0278b7e6b37a06e597edc08d80096235870a58

## Problem
El planificador semanal utiliza un horario equivocado para el domingo inmediatamente anterior al lunes visible. En `workingIntervals` inventa el domingo pasado usando la semana actual cuando no hay registro anterior; en `recoveryDates` consulta siempre `input.week`, aunque `previousWeek` contenga el horario anterior canónico. Puede ofrecer Move el lunes tras una noche realmente trabajada o restringir el lunes por un turno futuro.

## Desired behavior
El domingo anterior al lunes visible procede **solo** de `previousWeek` cuando está disponible. La ausencia de esa semana se trata como información desconocida: no se extrapola automáticamente el domingo de `week`. Para lunes-domingo visibles, se utiliza `week` igual que antes. Turnos nocturnos del domingo anterior protegen tanto intervalos de trabajo/sueño como la jornada de recuperación del lunes.

## Roadmap fit
- Phase decision: NOW.
- Reason: el Blueprint Maestro v4.0 exige fuente de verdad, protección de recuperación, soporte de cruces de medianoche y coherencia entre Semana, Move y Brain antes de ampliar funciones. Corregir un error real del límite semanal es consolidación, no una función nueva.

## Scope
- In scope: corregir origen del domingo `offset=-1` en `workingIntervals` y en `recoveryDates` del motor `proposeWeeklyPlan`; agregar pruebas de regresión.
- Affected modules: `src/brain/weeklyPlanner.ts`, `tests/brain-move-weekly.test.ts`; los consumidores de propuestas incluyen Semana, Asistente y confirmación de planes.

## Non-goals
- Sin nuevas pantallas ni mensajes, sin cambios de frecuencia/intensidad de Move, sin nuevos parsers OCR, sin tocar flujo de confirmación, recordatorios, firma Android o lógica de preferencias.

## Acceptance criteria
- [ ] AC1: con domingo previo nocturno en `previousWeek` y semana visible con lunes libre, la propuesta no programa Move el lunes y declara protección del descanso.
- [ ] AC2: un domingo nocturno **solo** en la semana visible no bloquea el lunes anterior; ocurre tanto con `previousWeek` explícitamente libre como sin `previousWeek`.
- [ ] AC3: en vista de la próxima semana (`weekOffset=1`) se utiliza el domingo de la semana corriente transmitida como `previousWeek` para proteger el siguiente lunes.
- [ ] AC4: las propuestas mantienen pureza (`preview` sin mutación); los planes existentes con noche martes-miércoles siguen protegiendo el miércoles y el resto de la suite no regresa.

## Data / persistence impact
Ninguno: tipos, SQLite, identificadores de semana, historial, migración y guardado de planes no cambian. Solo se corrige el cálculo efímero de propuesta. El plan confirmado actual no se sobreescribe automáticamente.

## UI / UX impact
Ningún control nuevo. Los horarios propuestos por Semana y Asistente resultan coherentes con el domingo real anterior; la advertencia de recuperación existente se usa cuando procede.

## Edge cases / regressions
- `previousWeek=null` debe evitar deducir pasado de la semana nueva.
- Una noche del domingo visible afecta el lunes siguiente **fuera** de la vista, no el lunes previo.
- Próxima semana con `weekOffset=1` y dos horarios independientes.
- Comprobar no solapamiento con bloqueos, eventos, cambios de medianoche y la prueba existente de noche martes-miércoles.
- Sibling screens/components: `WeeklyPlannerPreview`, `useAssistantController`, `weeklyPlanPersistence` ya transmiten `previousWeek`, sin modificaciones previstas.

## Verification plan
- [ ] Tests de regresión nuevos en `tests/brain-move-weekly.test.ts`.
- [ ] GitHub Actions Quality (TypeScript, tests, Metro Android).
- [ ] Inspección de diff para asegurar que se tocan solo motor, tests y documentación TLC.
- [ ] Prueba física de planificación en Redmi, si la función está expuesta en APK (externa a esta sesión).
- [ ] Registrar evidencias AC como PASS/BLOCKED.

## Implementation notes
Fijar el origen de información del domingo anterior de forma explícita; no tratar `week` como una repetición semanal para fechas fuera de su ancla.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- Android físico: BLOCKED (sin prueba en dispositivo por esta sesión).
