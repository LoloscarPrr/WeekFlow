# WF-MOVE-007 — Cierre de Move 0.2.x

Status: DONE
Owner: WeekFlow
Approved scope: Oscar · 30-09-2026
Blueprint: WeekFlow Blueprint Maestro v4.0
Roadmap target: 0.2.x — Move completo

## Problem
El Blueprint v4.0 redefine el orden del roadmap y ubica Move como la fase inmediata. El código actual de Move evolucionó durante varias builds y ya contiene el comportamiento exigido por el gate, pero dos specs históricas (`WF-MOVE-002` y `WF-MOVE-004`) seguían marcadas como LOCKED/PENDING aunque sus cambios sí fueron implementados y cubiertos por regresiones posteriores.

Seguir agregando funciones sin reconciliar este estado produciría feature creep y haría imposible saber si Move está realmente cerrado.

## Desired behavior
Move se considera completo para 0.2.x cuando una persona puede:
1. tener un perfil físico/contextual sin somatotipos simplistas;
2. recibir una propuesta adaptada a energía, turno, experiencia, tiempo y equipo/cargas reales;
3. iniciar una sesión guiada y completarla de punta a punta;
4. pausar, descansar y cambiar ejercicios sin romper compatibilidad;
5. finalizar y registrar feedback `Muy fácil / Bien / Difícil / Demasiado`;
6. obtener en la siguiente propuesta una adaptación coherente de duración, intensidad y dificultad/variante;
7. conservar historial y preferencias al actualizar la app.

## Scope
- Auditar el estado actual de Move contra el criterio de salida v4.0.
- Verificar flujo de `MovePlan`, `MovePlayer`, `MoveFeedback`, adaptación, biblioteca, progresión y persistencia.
- Reconciliar `WF-MOVE-002` y `WF-MOVE-004` con el comportamiento ya enviado.
- No introducir comportamiento nuevo si el criterio ya está satisfecho.

## Non-goals
- No ampliar biblioteca por volumen.
- No añadir entrenador de voz/IA.
- No programas periodizados avanzados, cálculo 1RM ni aumento automático de kilos.
- No diagnóstico ni rehabilitación.

## Data / persistence impact
Ninguno.

## UI / UX impact
Ninguno.

## Acceptance criteria
- [x] AC1 — Perfil con objetivo, experiencia, peso/altura opcionales y equipo/cargas reales sin somatotipos.
- [x] AC2 — Duración/intensidad adaptan energía, turno y feedback previo; tiempo disponible es configurable.
- [x] AC3 — Rutina respeta equipo, bajo impacto, suelo/silla, zonas evitadas y exclusiones.
- [x] AC4 — Sesión guiada completa con temporizador/series/AMRAP, pausa, descanso y cambio de ejercicio.
- [x] AC5 — Se guarda sesión real, ejercicios, duración/fin anticipado e historial compatible.
- [x] AC6 — Feedback cambia coherentemente siguiente duración/intensidad/dificultad sin aumentar cargas declaradas automáticamente.
- [x] AC7 — `move-adaptation`, `move-library-progression` y `move-structured-workouts` pasan en Quality.
- [x] AC8 — `WF-MOVE-002` y `WF-MOVE-004` reconciliadas como DONE con evidencia.
- [x] AC9 — PR Quality #207 PASS y main Quality #208 PASS. Android #155 permanece PASS y vigente porque el cierre solo modificó `docs/`, fuera de los paths de build Android.
- [x] AC10 — Move 0.2.x cerrado; foco oficial avanza a Food 0.3.x.

## Edge cases / regressions
- Energía agotada o fin anticipado no produce una sesión más exigente.
- `Demasiado` reduce claramente exigencia.
- `Muy fácil` puede progresar variante sin inventar equipo ni kilos.
- Preferencias legacy cargan sin migración destructiva.
- Pausa congela tiempo efectivo.
- Fin anticipado alimenta adaptación conservadora.

## Verification evidence
- `src/move/MovePlan.tsx`, `MovePlayer.tsx`, `MoveFeedback.tsx`, `useMoveController.ts`.
- `tests/move-adaptation.test.ts`, `move-library-progression.test.ts`, `move-structured-workouts.test.ts`.
- `CHANGELOG-0.3.23.md`, `0.3.24.md`, `0.3.25.md`.
- PR #101 / Quality #207: PASS.
- Main commit `de0a8f894f5700761443b184e5914cada218b306` / Quality #208: PASS.
- Android #155 on unchanged runtime/config: PASS.

## Verification result
AC1–AC10: PASS. Move 0.2.x is closed under Blueprint Maestro v4.0.
