# WF-NOW-001 — Prioridad viva primero en Ahora

Status: LOCKED
Owner: WeekFlow
Approved scope: Oscar · 06-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
Ahora debe responder primero “¿Qué importa ahora?”, pero la pantalla actual muestra resumen del Brain y selector de energía antes de la tarjeta viva que contiene la prioridad real.

## Desired behavior
La prioridad viva debe ser el primer contenido funcional después del encabezado. El resto de contexto sigue disponible, pero visualmente subordinado.

## Roadmap fit
- Phase decision: NOW.
- Reason: es una corrección acotada de una regla canónica ya existente de Ahora, no un nuevo módulo.

## Scope
- Cambiar el título principal a “Qué importa ahora”.
- Mover la tarjeta `DÍA VIVO` inmediatamente después del encabezado.
- Mantener sin cambios sus acciones de salida real/reajuste.
- Mantener resumen del Brain, energía y “Lo que viene” debajo.

## Non-goals
- Cambiar cálculo de prioridades.
- Crear nuevas tarjetas o métricas.
- Cambiar persistencia, timeline o lógica de jornada.

## Acceptance criteria
- [ ] AC1 — La tarjeta viva aparece antes del resumen Brain y del selector de energía.
- [ ] AC2 — El encabezado comunica “Qué importa ahora”.
- [ ] AC3 — “Ya salí”, corrección de hora y reajuste conservan sus handlers actuales.
- [ ] AC4 — Timeline y selector de energía siguen presentes.
- [ ] AC5 — No hay cambios de persistencia o dominio.

## Data / persistence impact
NONE.

## UI / UX impact
Reorden visual deliberado; sin datos nuevos.

## Edge cases / regressions
- Jornada en curso.
- Jornada terminada con salida por confirmar.
- Día sin timeline urgente.
- Pantallas angostas.

## Verification plan
- Typecheck + regresiones automáticas.
- Revisión estructural del JSX.
- Android build.
