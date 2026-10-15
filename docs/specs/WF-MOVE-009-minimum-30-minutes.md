# WF-MOVE-009 — Move sin versiones inferiores a 30 minutos

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-15
Blueprint: WeekFlow Blueprint Maestro v4.0
Supersedes: WF-MOVE-008 (the user's newer explicit preference overrides the shorter-session UX)

## Problem
La escala automática de 5/10/20 minutos y el botón «Dame una versión más corta» no reflejan la preferencia de entrenamiento: 30 minutos ya es una sesión corta.

## Desired behavior
Las nuevas sesiones sugeridas y seleccionables ofrecen como mínimo 30 minutos. Un día de baja energía cambia la intensidad/recuperación, no reduce la recomendación a 5 o 10 minutos. No aparece el botón de acortar.

## Roadmap fit
- Phase decision: NOW.
- Reason: corrección explícita del producto Move en ejecución.

## Scope
- Selector con 30, 45 y 60 min.
- Recomendación de 30 o 45 min según contexto y feedback; jamás inferior a 30.
- Quitar acción, estado y textos «versión más corta».
- Mantener modelo de intensidad, ejercicios/equipo/feedback, generador, progreso e historial.
- Sesiones anteriores de 5/10/20 min se conservan y pueden reanudarse si están activas.

## Non-goals
- No forzar a nadie a completar una sesión de 30 min si necesita parar.
- No aumentar kilos automáticamente.
- No borrar historial ni modificar esquema.
- No cambiar las «mini-versiones» de Habits, que son otra función.

## Acceptance criteria
- AC1: Move muestra opciones 30/45/60, sin 5/10/20 ni acción de acortar.
- AC2: Las recomendaciones nunca son inferiores a 30; energía agotada sigue priorizando recuperación.
- AC3: La sesión generada usa la duración elegida y el feedback/equipo existentes.
- AC4: Sesiones activas e historial anteriores conservan su duración original.
- AC5: Las pruebas actualizadas pasan y no se altera la persistencia.

## Data / persistence impact
None; existing records may have original shorter durations.

## UI / UX impact
Menos controles y microcopy; tiempo/volumen guiado por selección expresa.

## Edge cases / regression plan
Días libres, turnos largos/nocturnos, energía agotada, feedback «Difícil/Demasiado», sesión activa histórica de 10 min; tests de recomendación, intensidad y duración en el generador, Quality CI y Android antes de liberar.

## Verification progress
- PASS — AC1: selector ofrece 30, 45 y 60, sin botón de «versión más corta».
- PASS — AC2: recomendación base 30/45, con suelo de 30 aun para energía agotada y feedback difícil; intensidad adaptativa intacta.
- PASS — AC3: generador ahora soporta 45/60 minutos completos; pruebas de intervalos, series y AMRAP añadidas.
- PASS — AC4: sesión activa conserva plannedMinutes histórico; al terminar las nuevas selecciones tienen mínimo 30. Historial no migrado.
- PASS — Quality #38822617223: TypeScript + regresiones. BLOCKED — build Android y prueba en teléfono pendientes.
