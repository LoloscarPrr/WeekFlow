# WF-BRAIN-001 — Brain Action Foundation

Status: DONE
Owner: WeekFlow
Approved scope: Oscar · 08-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
WeekFlow Brain ya calcula planes, pero no existe un contrato común para convertir una decisión del Brain en un cambio real y controlado del estado. Ahora y Semana aplican cambios desde sus propios controladores, lo que funciona para UI directa pero no ofrece todavía una base segura para que el Asistente proponga, confirme, aplique y deshaga acciones reales.

## Desired behavior
El Brain puede representar una acción como una propuesta estructurada y explicable. Una propuesta que requiere confirmación no se aplica sin confirmación explícita. Al aplicarse, reutiliza los use cases existentes y entrega un recibo con estado anterior/posterior suficiente para revertirla. Deshacer solo procede si el estado actual sigue coincidiendo con el estado que dejó esa acción, evitando pisar cambios posteriores.

0.7.1 demuestra el contrato con dos acciones de referencia:
- cambiar energía del día;
- actualizar un turno semanal.

## Roadmap fit
- Phase decision: NOW
- Reason: es la fundación técnica mínima de 0.7.x para que el Asistente pueda modificar el estado real sin mantener estado paralelo ni introducir automatización opaca.

## Scope
- Contrato puro `BrainActionProposal`.
- Acciones tipadas de referencia: `set-energy` y `update-week-shift`.
- Explicación humana obligatoria para cada propuesta.
- Flag explícito `requiresConfirmation`.
- Ejecutor puro que aplica acciones sobre `DayState + WeekSchedule`.
- Reutilizar `updateNowEnergy` y `updateWeekShift`.
- Recibo `BrainActionReceipt` con before/after y timestamp.
- Undo seguro: solo revertir si el estado objetivo no cambió después de aplicar la acción.
- Resultado explícito `applied | confirmation-required | conflict | reverted`.
- Tests puros y estructurales.
- Cerrar formalmente `WF-NOTIFY-004` con evidencia del Android #167.

## Non-goals
- Chat UI.
- Interpretación de texto o voz.
- LLM/IA remota.
- Persistir una cola de propuestas.
- Ejecutar acciones automáticamente desde Asistente.
- Reorganización de múltiples módulos.
- Smart Import.
- Modificar eventos importantes en esta spec.
- Reescribir controladores Ahora/Semana para que dependan de este foundation.

## Acceptance criteria
- [ ] AC1 — Una propuesta contiene ID, kind, título, explicación, payload, fecha y requisito de confirmación.
- [ ] AC2 — Una propuesta que requiere confirmación no cambia estado si `confirmed=false`.
- [ ] AC3 — `set-energy` aplica exactamente mediante `updateNowEnergy`.
- [ ] AC4 — `update-week-shift` aplica exactamente mediante `updateWeekShift`.
- [ ] AC5 — Aplicar produce un recibo con before/after y timestamp.
- [ ] AC6 — Undo devuelve el estado anterior cuando el estado actual coincide con el after del recibo.
- [ ] AC7 — Undo devuelve conflicto y no pisa cambios posteriores si el estado objetivo cambió.
- [ ] AC8 — El foundation no escribe SQLite ni mantiene un estado paralelo.
- [ ] AC9 — No se modifican Brain plan, Ahora, Semana ni persistencia existente.
- [ ] AC10 — Quality y Android release pasan antes de declarar DONE.

## Data / persistence impact
None. 0.7.1 es una capa pura sobre estados existentes. No agrega claves SQLite ni migraciones.

## UI / UX impact
No hay UI nueva en 0.7.1. El contrato define el copy mínimo que futuras interfaces podrán mostrar antes de confirmar:
- título;
- explicación;
- resumen del cambio.

## Edge cases / regressions
- Propuesta inválida/no reconocida.
- Día de semana inexistente.
- Undo después de un cambio posterior.
- Acción que produce el mismo valor que ya existía.
- Confirmación faltante.
- Estado Week reabierto a manual por un cambio de turno debe conservar la semántica actual del use case.

## Verification plan
- Tests puros para proposal/apply/undo/conflict.
- Test estructural que garantice reutilización de use cases y ausencia de persistencia.
- Ejecutar Quality en PR.
- Merge solo con Quality verde.
- Ejecutar Android firmado post-merge.
- No declarar comportamiento conversacional ni QA físico porque esta spec no introduce UI.

## Implementation notes
- La comparación de conflicto será determinista sobre el target afectado, no sobre todo el estado global.
- El recibo guarda snapshots del target para permitir undo sin depender de una cola persistente.


## Verification result

- AC1: PASS — proposal incluye id, kind, title, explanation, payload, createdAt y requiresConfirmation.
- AC2: PASS — `confirmation-required` conserva el estado y no genera receipt.
- AC3: PASS — `set-energy` delega en `updateNowEnergy`.
- AC4: PASS — `update-week-shift` delega en `updateWeekShift`.
- AC5: PASS — aplicación genera receipt con before/after y appliedAt.
- AC6: PASS — undo válido revierte el target al snapshot anterior.
- AC7: PASS — undo detecta conflicto y conserva cambios posteriores.
- AC8: PASS — test estructural confirma ausencia de SQLite/save state en el foundation.
- AC9: PASS — no se modificaron Brain plan, Ahora, Semana ni persistencia existente.
- AC10: PASS — Quality #260/#261/#262 PASS y Android #168 generó APK + AAB firmados.

Incident resolved before merge:
- Quality #259 detectó fixtures de test con discriminated union ambiguo; corregido sin casts ni debilitamiento de tipos.
- Quality #260: PASS.
