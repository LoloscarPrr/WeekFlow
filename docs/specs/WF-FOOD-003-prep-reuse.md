# WF-FOOD-003 — Preparación anticipada y reutilización

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 24-09-2026
Blueprint mapping: 0.4.x · Food completo · meal prep + reutilización

## Problem
Food ya puede proponer/cocinar una comida y construir compras, pero todavía no reduce trabajo futuro mediante porciones preparadas ni muestra qué recetas comparten ingredientes.

## Desired behavior
- Food puede guardar porciones preparadas explícitamente después de una sesión de prep.
- Las porciones preparadas sobreviven cierres/reaperturas en SQLite local.
- “Comí una porción” registra la comida y descuenta una porción.
- Al llegar a cero, la preparación sale de la lista.
- Se puede quitar manualmente una preparación sin registrar consumo.
- Food propone recetas aptas para preparar con antelación usando porciones >1.
- Food propone pares de recetas que reutilizan ingredientes canónicos compartidos y minimizan faltantes.
- Las sugerencias de reutilización muestran qué ingredientes se comparten.
- Food no inventa caducidad, conservación ni seguridad alimentaria.
- El historial distingue una comida consumida desde preparación.

## Scope
- Nuevo modelo local FoodPreparedMeal.
- Persistencia food-prepared.
- Funciones puras para agregar, sanitizar, consumir y quitar porciones.
- Ranking de recetas batch/prep.
- Ranking de pares de recetas por ingredientes compartidos + faltantes.
- Nueva pantalla Food Prep.
- Acceso desde Food principal.
- Guided cooking en modo “preparar” que guarda porciones en vez de registrar una comida inmediata.
- Consumo posterior desde Food Prep y acceso rápido desde Food principal.

## Non-goals
- Fechas de caducidad automáticas.
- Reglas médicas o de inocuidad alimentaria.
- Inventario por gramos/unidades exactas.
- Calendario semanal rígido de comidas.
- Notificaciones de caducidad.
- Sincronización cloud.

## Data / persistence impact
- Nueva key local food-prepared.
- FoodEntry.source admite prepared.
- Datos legacy cargan con lista preparada vacía.

## Edge cases
- Legacy sin key: lista vacía.
- Preparación con 0/negativo se descarta en sanitización.
- Consumir la última porción elimina la preparación.
- Consumir una porción registra exactamente una comida.
- Quitar no registra comida.
- Reuse pair nunca empareja una receta consigo misma.
- Reuse pair requiere al menos un ingrediente esencial compartido.
- Ranking considera faltantes sin afirmar disponibilidad inexistente.

## Acceptance criteria
- [ ] AC1 — Legacy carga food-prepared vacío.
- [ ] AC2 — Guardar una preparación persiste receta, título, porciones y fecha.
- [ ] AC3 — Consumir decrementa una porción.
- [ ] AC4 — Consumir la última porción elimina la preparación.
- [ ] AC5 — Quitar preparación no registra comida.
- [ ] AC6 — Comida consumida desde prep se guarda con source prepared.
- [ ] AC7 — Pantalla Food Prep muestra preparaciones disponibles.
- [ ] AC8 — Food Prep permite iniciar una receta de 2+ porciones como preparación anticipada.
- [ ] AC9 — Finalizar modo prep guarda las porciones declaradas y no registra que se comieron.
- [ ] AC10 — Food principal muestra acceso/contador de porciones preparadas.
- [ ] AC11 — Ranking de reutilización propone pares con ingredientes esenciales compartidos.
- [ ] AC12 — UI muestra qué ingredientes comparten las dos recetas.
- [ ] AC13 — No se muestran caducidades ni garantías de seguridad.
- [ ] AC14 — Historial manual/suggestion/recipe existente sigue compatible.
- [ ] AC15 — TypeScript + regresiones pasan.
- [ ] AC16 — Android release 0.4.1 genera APK + AAB firmados.

## Verification plan
- Tests puros de persistencia/sanitización/consumo.
- Tests de ranking de reutilización.
- Tests de source prepared.
- Typecheck + regresiones.
- PR Quality, main Quality y Android signed release.
- Validación física posterior de camera/prep UX.

## Verification result
- AC1–AC16: PENDING
