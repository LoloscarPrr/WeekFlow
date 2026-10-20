# WF-BRAIN-004 — Deshacer el último cambio del Asistente

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-20
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
El Asistente ya aplica cambios confirmados de energía y horario, pero no ofrece la acción visible de deshacer. El foundation Brain ya genera `BrainActionReceipt` y dispone de `undoBrainAction` seguro, pero el controller descarta el recibo y la pantalla no expone la reversión.

## Desired behavior
Después de aplicar un cambio que modifica realmente el estado, el Asistente ofrece una única opción breve «Deshacer cambio»; utiliza el recibo del Brain y persiste únicamente el target canónico revertido. Si dicho target cambió entretanto, no altera nada y comunica el conflicto. El recordatorio se vuelve a sincronizar tras un undo exitoso.

## Roadmap fit
- Phase decision: NOW.
- Reason: corresponde explícitamente a 0.7.4 del roadmap vigente y a una funcionalidad pospuesta de `WF-BRAIN-003`. Refuerza la decisión canónica de reversibilidad.

## Scope
- Conservar en memoria solo el último `BrainActionReceipt` que represente un cambio real; no crear almacenamiento paralelo ni historial de undo.
- Mostrar «Deshacer cambio» solo si hay recibo válido y no hay otra propuesta pendiente.
- Al pulsar, recargar DayState y WeekSchedule canónicos, ejecutar `undoBrainAction` y respetar resultado `reverted`/`conflict`.
- Persistir solo el objetivo revertido: `saveDayState` o `saveWeekState`.
- Refrescar Estado real y recordatorios después de una reversión; limpiar la opción de undo tras éxito o conflicto.
- Mantener propuestas confirmables, cancelación, acceso a ajustes y flujo actual.
- Usar versión técnica siguiente `0.5.13` para un nuevo build instalable sobre la anterior.

## Non-goals
- No cola de múltiples undo, undo persistente entre arranques, redo, nuevo esquema SQLite ni escritura automática sin confirmar.
- No interpretar lenguaje adicional, Smart Import, cambios de diseño ajenos al Asistente ni nuevo módulo IA.
- No deshacer cambios hechos desde otras pantallas; solo el último cambio confirmado en la sesión del Asistente.

## Acceptance criteria
- AC1: Después de confirmar un cambio efectivo de energía u horario aparece un único botón «Deshacer cambio».
- AC2: Si el resultado no modificó el estado, no aparece undo innecesario.
- AC3: El botón se oculta mientras exista una propuesta pendiente; cancelar esta propuesta no borra un undo previo.
- AC4: Undo correcto utiliza `undoBrainAction`, devuelve el valor anterior, persiste exclusivamente la fuente de verdad objetivo y refresca contexto y avisos.
- AC5: Si otra acción cambió el target desde la confirmación, se informa del conflicto y no se pisan los cambios posteriores.
- AC6: Tras undo o conflicto, no queda una opción de revertir obsoleta; no hay datos adicionales persistidos.
- AC7: Quality (typecheck y regresiones) y build Android firmado pasan; firma, package y actualización se conservan.

## Data/persistence impact
No hay schema nuevo. Solo se escriben DayState o WeekSchedule existentes, mediante helpers canónicos, si `undoBrainAction` entrega `reverted`.

## UI/UX impact
Único botón breve junto al mensaje del Asistente, sin tarjeta explicativa permanente ni encabezados redundantes.

## Edge cases/regressions
- Cambios no-op.
- Usuario introduce una segunda propuesta y la cancela.
- Otro módulo cambia energía u horario antes del undo.
- Undo de energía y de turno; cambio fuera de turno no debe alterar estado paralelo.
- Desaparición del botón tras undo/conflicto, visibilidad con teclado.
- Al volver a abrir la app no hay un falso undo persistente.

## Verification plan
Prueba unitaria pura de `BrainActionReceipt` efectivo/no-op, regresiones existentes `brain-actions.test.ts` y pruebas estructurales de Asistente; Quality CI del PR y build firmado post-merge; verificar instalación sobre 0.5.12 en teléfono antes de declarar QA físico.

## Verification
- AC1: PASS — `app/assistant.tsx` muestra una acción compacta y accesible cuando hay recibo efectivo.
- AC2: PASS — `receiptHasEffectiveChange` evita mostrar undo para no-op; test puro agregado.
- AC3: PASS — la acción se oculta al existir una propuesta pendiente; cancelación no borra el recibo previo.
- AC4: PASS — controller utiliza `undoBrainAction` sobre datos frescos, guarda solo el target revertido, reconstruye contexto y sincroniza recordatorios.
- AC5: PASS — `undoBrainAction` impide sobrescribir un target modificado después; tests puros de energía y horario.
- AC6: PASS — el recibo se descarta tras undo/conflicto; sin nueva persistencia.
- AC7: Quality #39366129691 PASS (TypeScript + regresiones). Android release firmado 0.5.13 y QA física: PENDING, no declarar DONE hasta verificar APK.
- No cambia lógica Move, Food, Rest, Semana ni paquete/firma; Android source versionCode 105 y CI monotónico.
