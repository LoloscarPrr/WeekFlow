# WF-BRAIN-002 — Asistente conectado al estado real

Status: DONE
Owner: WeekFlow
Approved scope: Oscar · 08-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
El Asistente actualmente es solo un menú de accesos. Para avanzar en 0.7.x necesita leer el mismo estado real que usan Ahora, Semana, Move, Food y Rest, sin crear una copia paralela ni persistencia propia.

## Desired behavior
Al abrir Asistente, WeekFlow construye una vista de contexto en memoria desde las fuentes canónicas existentes:
- energía actual;
- contexto vivo de Ahora;
- jornada/semana real;
- si Move ya se completó hoy;
- registros Food de hoy;
- contexto Rest actual/próximo.

La pantalla muestra un resumen compacto de ese estado. Al volver a enfocar Asistente, el resumen se refresca desde persistencia canónica.

## Roadmap fit
- Phase decision: NOW
- Reason: es el segundo bloque de 0.7.x. Antes de interpretar texto/voz, el Asistente debe compartir el mismo estado real del Brain y de los módulos.

## Scope
- Nuevo builder puro de contexto del Asistente.
- Nuevo controller/hook que lee únicamente fuentes canónicas existentes.
- Reutilizar `getNowView` y `getRestView`.
- Señal Move: completado hoy o no.
- Señal Food: cantidad de registros de hoy y último registro si existe.
- Mostrar “Estado real” en `/assistant` antes de los controles.
- Refrescar en focus.
- Sin persistencia nueva.
- Cerrar `WF-BRAIN-001` con evidencia Android #168.

## Non-goals
- Chat o caja de texto.
- Voz.
- Interpretación de lenguaje natural.
- Ejecutar BrainActionProposal desde la UI.
- LLM/IA remota.
- Smart Import.
- Crear un nuevo store del Asistente.
- Reorganización automática del plan.

## Acceptance criteria
- [ ] AC1 — El contexto del Asistente se deriva de DayState, WeekSchedule, Move, Food y perfil canónicos.
- [ ] AC2 — Ahora se deriva reutilizando `getNowView`, no duplicando su lógica.
- [ ] AC3 — Rest se deriva reutilizando `getRestView`, no duplicando su lógica.
- [ ] AC4 — Move refleja si existe una sesión terminada hoy.
- [ ] AC5 — Food refleja registros de hoy y el último registro cuando existe.
- [ ] AC6 — La pantalla Asistente muestra energía, estado vivo, jornada, Move, Food y Rest.
- [ ] AC7 — El contexto se refresca al volver a enfocar Asistente.
- [ ] AC8 — No se agrega persistencia ni estado paralelo del Asistente.
- [ ] AC9 — Los accesos existentes del Asistente se conservan.
- [ ] AC10 — Quality y Android release pasan antes de declarar DONE.

## Data / persistence impact
None. El controller solo lee persistencia existente.

## UI / UX impact
- Nueva sección compacta “ESTADO REAL”.
- Debe priorizar lectura rápida, sin convertir Asistente en dashboard.
- Los controles existentes permanecen debajo.

## Edge cases / regressions
- Día libre.
- Sin historial Move.
- Sin registros Food hoy.
- Sin próximo turno.
- Turno nocturno/recovery.
- Perfil sin nombre.
- Reingreso a Asistente después de cambiar energía o Semana.

## Verification plan
- Tests puros del builder.
- Test estructural de UI/controller y ausencia de persistencia propia.
- Quality en PR.
- Merge solo con Quality verde.
- Android firmado post-merge.


## Verification result

- AC1: PASS — controller lee perfil, DayState, WeekSchedule, Move y Food desde persistencia canónica.
- AC2: PASS — controller deriva Ahora mediante `getNowView`.
- AC3: PASS — controller deriva Rest mediante `getRestView`.
- AC4: PASS — builder detecta sesión Move terminada en la fecha local actual.
- AC5: PASS — builder cuenta Food de hoy y selecciona el último registro cronológico.
- AC6: PASS — Asistente muestra estado vivo, energía, jornada, Move, Food y Rest.
- AC7: PASS — `useFocusEffect` vuelve a leer las fuentes al recuperar foco.
- AC8: PASS — builder/controller no guardan estado ni usan nuevas claves SQLite.
- AC9: PASS — Cuenta, Notificaciones, Privacidad, Horario e Importar se conservan.
- AC10: PASS — Quality #266/#267/#268 PASS y Android #169 generó APK + AAB firmados.

Incident resolved before merge:
- Quality #263 detectó que el test puro arrastraba aliases Expo desde `getNowView`.
- Se corrigió la frontera: controller deriva Now/Rest; builder puro recibe esas vistas canónicas.
- Quality #266: PASS.
