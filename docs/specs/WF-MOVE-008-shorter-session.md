# WF-MOVE-008 — Versión más corta de la sesión

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 06-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
Move ya adapta la sesión antes de empezar, pero cuando el usuario ve que el tiempo disponible real es menor todavía debe elegir manualmente otra duración. WeekFlow debe facilitar una reducción inmediata sin tratarla como fracaso ni cambiar arbitrariamente el objetivo.

## Desired behavior
Cuando la sesión seleccionada supera 5 minutos, Move ofrece “Dame una versión más corta”. La acción reduce la duración al siguiente peldaño disponible y recalcula la rutina usando exactamente las mismas preferencias, objetivo, energía, intensidad adaptativa, equipo/cargas, exclusiones y feedback.

## Roadmap fit
- Phase decision: NOW.
- Reason: mejora directamente el criterio canónico de Move “sesión apropiada para su energía, tiempo y equipo” sin reabrir arquitectura ni crear un módulo nuevo.

## Scope
- Duraciones cortas escalonadas: 30→20→10→5; valores intermedios se reducen al peldaño inferior seguro.
- Botón contextual visible solo cuando existe una versión menor.
- Reutilizar el generador actual para preview y sesión.
- Añadir regresiones puras para la reducción de tiempo.

## Non-goals
- Aumentar automáticamente kilos.
- Cambiar intensidad por pulsar el botón.
- Modificar historial o esquema de persistencia.
- Crear una sesión por IA.
- Añadir Food/Rest/Brain.

## Acceptance criteria
- [ ] AC1 — 30 min reduce a 20, 20 a 10 y 10 a 5.
- [ ] AC2 — Valores intermedios usan el peldaño menor coherente; 5 nunca baja de 5.
- [ ] AC3 — El botón desaparece/no se ofrece cuando la duración ya es 5 min.
- [ ] AC4 — Tras reducir, preview y sesión se regeneran con las mismas preferencias, intensidad y restricciones.
- [ ] AC5 — El copy deja claro que se reduce volumen/tiempo, no que el usuario “falló”.
- [ ] AC6 — No hay migración ni cambio de esquema de persistencia.

## Data / persistence impact
NONE.

## UI / UX impact
Nueva acción secundaria bajo el selector de duración.

## Edge cases / regressions
- Duración recomendada de 5 min por energía agotada.
- Rutina con equipo/cargas.
- Zonas evitadas.
- Feedback previo “Difícil/Demasiado”.
- Sesión activa: no se modifica una sesión ya iniciada.

## Verification plan
- Añadir test de `shorterMoveDuration`.
- Ejecutar Quality CI.
- Ejecutar Android build en main tras merge.

## Verification result

- AC1: PASS — regresiones verifican 30→20, 20→10 y 10→5.
- AC2: PASS — regresiones verifican 15→10, 7→5 y 5→5.
- AC3: PASS — UI solo renderiza la acción cuando `duration > 5`.
- AC4: PASS — la acción solo cambia `duration`; preview y `startSession` siguen reutilizando preferencias, intensidad adaptativa, progresión, equipo y restricciones existentes.
- AC5: PASS — copy: “Mantiene tu objetivo, energía, equipo y restricciones. Solo reduce el volumen...”.
- AC6: PASS — no hay cambios de esquema ni migración.

Quality #245: PASS — typecheck + regresiones completas, incluida la escalera de duración en `move-adaptation.test.ts`.
Android release: pendiente del workflow post-merge de `main`.
