# WF-MOVE-007 — Cierre de Move 0.2.x

Status: LOCKED
Owner: WeekFlow
Approved scope: Oscar · 30-09-2026
Blueprint: WeekFlow Blueprint Maestro v4.0
Roadmap target: 0.2.x — Move completo

## Problem
El Blueprint v4.0 redefine el orden del roadmap y ubica Move como la fase inmediata. El código actual de Move evolucionó durante varias builds y ya contiene gran parte del comportamiento requerido, pero dos specs históricas (`WF-MOVE-002` y `WF-MOVE-004`) siguen marcadas como LOCKED/PENDING aunque sus cambios sí fueron implementados y cubiertos por regresiones posteriores.

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
Ninguno previsto. Este cierre no cambia esquema SQLite ni formato de preferencias/historial. Si la auditoría descubre que falta persistencia necesaria para el gate, el alcance deberá actualizarse antes de modificar código.

## UI / UX impact
No se añade UI por defecto. La prioridad es validar el flujo existente y evitar añadir controles redundantes.

## Acceptance criteria
- [ ] AC1 — El perfil Move permite objetivo, experiencia, peso/altura opcionales y equipo/cargas reales sin somatotipos.
- [ ] AC2 — La propuesta de hoy adapta duración/intensidad usando energía, turno y feedback previo, y permite declarar el tiempo disponible.
- [ ] AC3 — La rutina generada respeta equipo, bajo impacto, suelo/silla, zonas evitadas y ejercicios excluidos.
- [ ] AC4 — El usuario puede iniciar y completar una sesión guiada con temporizador/series/AMRAP, pausa, descanso y cambio de ejercicio cuando corresponde.
- [ ] AC5 — Al finalizar se guarda sesión real, ejercicios realizados, duración/fin anticipado e historial compatible.
- [ ] AC6 — El feedback final persiste y cambia de forma coherente la siguiente duración/intensidad/dificultad sin aumentar automáticamente cargas declaradas.
- [ ] AC7 — Las regresiones `move-adaptation`, `move-library-progression` y `move-structured-workouts` pasan en Quality.
- [ ] AC8 — `WF-MOVE-002` y `WF-MOVE-004` quedan reconciliadas con evidencia real de implementación, o se documenta exactamente qué falta.
- [ ] AC9 — Main conserva Quality + Android release verdes después del cierre documental.
- [ ] AC10 — Con estos puntos PASS, Move 0.2.x se marca cerrado y el siguiente foco oficial pasa a Food 0.3.x.

## Edge cases / regressions
- Energía agotada o sesión anterior terminada antes no debe producir una sesión más exigente.
- `Demasiado` debe reducir claramente la exigencia.
- `Muy fácil` puede progresar variante, pero no inventar equipo ni kilos.
- Dos preferencias legacy deben seguir cargando sin migración destructiva.
- Pausa no debe avanzar tiempo de ejercicio ni sesión.
- Finalizar antes debe registrarse como tal y alimentar adaptación conservadora.

## Verification plan
- Revisar `src/move/adaptation.ts`, `library.ts`, `exerciseCatalog.ts`, `progression.ts`, `useMoveController.ts`, `MovePlan.tsx`, `MovePlayer.tsx`, `MoveFeedback.tsx` y persistencia.
- Revisar las tres suites Move existentes y changelogs que documentan el comportamiento enviado.
- Actualizar las specs históricas solo con evidencia soportada por código/tests.
- Abrir PR con `Spec: WF-MOVE-007`.
- Ejecutar Quality en PR y, tras merge, comprobar Quality + Android en main.

## Verification result
PENDING.
