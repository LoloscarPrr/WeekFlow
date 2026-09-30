# WF-MOVE-007 — Cierre de Move 0.2.x

Status: VERIFYING
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
- Verificar que `MovePlan`, `MovePlayer`, `MoveFeedback`, adaptación, biblioteca, progresión y persistencia forman un flujo coherente.
- Reconciliar `WF-MOVE-002` y `WF-MOVE-004` con el comportamiento ya enviado cuando exista evidencia suficiente.
- Usar Quality actual y regresiones Move como evidencia ejecutable.
- No introducir comportamiento nuevo si el criterio ya está satisfecho.

## Non-goals
- No ampliar la biblioteca solo para aumentar el número de ejercicios.
- No añadir entrenador de voz/IA; corresponde al Brain/Assistant posterior.
- No implementar programas periodizados avanzados, cálculo 1RM ni aumento automático de kilos.
- No diagnosticar lesiones ni prescribir rehabilitación.
- No tocar Food, Rest, Smart Import ni otros módulos.

## Data / persistence impact
Ninguno. Este cierre no cambia esquema SQLite ni formato de preferencias/historial.

## UI / UX impact
Ninguno. La auditoría confirma que el flujo existente ya cubre el gate y añadir controles sería redundante.

## Acceptance criteria
- [x] AC1 — El perfil Move permite objetivo, experiencia, peso/altura opcionales y equipo/cargas reales sin somatotipos.
- [x] AC2 — La propuesta de hoy adapta duración/intensidad usando energía, turno y feedback previo, y permite declarar el tiempo disponible.
- [x] AC3 — La rutina generada respeta equipo, bajo impacto, suelo/silla, zonas evitadas y ejercicios excluidos.
- [x] AC4 — El usuario puede iniciar y completar una sesión guiada con temporizador/series/AMRAP, pausa, descanso y cambio de ejercicio cuando corresponde.
- [x] AC5 — Al finalizar se guarda sesión real, ejercicios realizados, duración/fin anticipado e historial compatible.
- [x] AC6 — El feedback final persiste y cambia de forma coherente la siguiente duración/intensidad/dificultad sin aumentar automáticamente cargas declaradas.
- [x] AC7 — Las regresiones `move-adaptation`, `move-library-progression` y `move-structured-workouts` forman parte del Quality actual; baseline main Quality #206 es PASS.
- [x] AC8 — `WF-MOVE-002` y `WF-MOVE-004` quedaron reconciliadas como DONE con evidencia de código/tests/changelogs.
- [ ] AC9 — Main conserva Quality + Android release verdes después del merge de este cierre documental.
- [ ] AC10 — Tras AC9, Move 0.2.x se marca cerrado y el siguiente foco oficial pasa a Food 0.3.x.

## Edge cases / regressions
- Energía agotada o sesión anterior terminada antes no produce una sesión más exigente.
- `Demasiado` reduce claramente duración/intensidad y dificultad.
- `Muy fácil` puede progresar variante, pero no inventa equipo ni kilos.
- Preferencias legacy siguen cargando sin migración destructiva.
- Pausa congela el tiempo efectivo de ejercicio/sesión.
- Finalizar antes se registra y alimenta una adaptación conservadora.

## Verification evidence
- `src/move/MovePlan.tsx`: objetivo, experiencia, peso/altura opcionales, equipo/cargas, restricciones, enfoque, formato y tiempo 5/10/20/30.
- `src/move/useMoveController.ts`: usa energía/turno/feedback previo; persiste sesión real, ejercicios, fin anticipado y feedback.
- `src/move/MovePlayer.tsx`: temporizador, series, AMRAP, descanso, pausa y cambio de ejercicio.
- `src/move/MoveFeedback.tsx`: `Muy fácil / Bien / Difícil / Demasiado`, nota opcional y persistencia.
- `tests/move-adaptation.test.ts`: duración/intensidad, equipo/cargas, restricciones, energía, feedback y migración legacy.
- `tests/move-library-progression.test.ts`: catálogo, compatibilidad, progresión/regresión y exclusiones.
- `tests/move-structured-workouts.test.ts`: sesiones estructuradas.
- `CHANGELOG-0.3.23.md`, `0.3.24.md`, `0.3.25.md`: evidencia histórica de biblioteca/progresión, selección y formatos estructurados.
- Baseline main: Quality #206 PASS; Android #155 PASS.

## Verification plan remaining
- Abrir PR con `Spec: WF-MOVE-007`.
- Ejecutar Quality del PR.
- Fusionar si Quality pasa.
- Comprobar Quality + Android en `main`.
- Registrar AC9/AC10 como PASS al iniciar el siguiente bloque Food, evitando una build documental extra solo para cambiar una palabra.

## Verification result
- AC1–AC8: PASS.
- AC9–AC10: PENDING hasta verificar `main` post-merge.
