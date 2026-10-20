# WF-BRAIN-005 — Registrar salida real desde Asistente

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-20
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
El usuario puede decir «hoy salí a las 22:30» pero el Asistente solo sabe interpretar «salgo» como modificación del horario semanal. Registrar la salida real ya existe en Ahora con replanificación y protección del descanso. Reimplementar una segunda lógica en Asistente crearía estados contradictorios.

## Desired behavior
Asistente reconoce «salí a las 22:30», «hoy salí a las 22:30» y «terminé mi turno a las 06:15» como un hecho ocurrido en la jornada activa, y presenta una propuesta confirmable. Al confirmar utiliza el use case canónico de salida real usado por Ahora, respetando la jornada actual, la revisión de reajustes flexibles y el mecanismo «Deshacer cambio». La Semana programada no cambia.

## Roadmap fit
- Phase decision: NOW.
- Reason: la fase canónica 0.7.x requiere registrar cambios reales y replanificar lo flexible; es la siguiente extensión mínima de Brain posterior a 0.7.4.

## Scope
- Diferenciar en parser la forma pasada «salí» / «terminé mi turno» de «salgo» (horario planeado).
- Exigir hora explícita exacta HH o HH:MM y rechazo de frases múltiples/ambigüedades; no adivinar «una hora tarde» ni fechas pasadas.
- La propuesta lleva `shiftKey` del plan canónico para detectar si Semana cambia antes de confirmar.
- El foundation ejecuta la corrección de salida usando `correctActualExitTime` y el contexto del Brain del momento; no duplica cálculo horario.
- Confirmar solo en turno real activo o recién terminado (`working`/`after`); rechazar día libre o traslado previo.
- Persistir solo `DayState`, sin tocar `WeekSchedule`.
- Mantener confirmación explícita y reversión con receipt existente.
- En caso de reajuste de bloques flexibles que requiere autorización adicional, indicar revisión en «Ahora» sin aplicarla silenciosamente.
- Versión técnica 0.5.14, con mismo package, firma y datos de instalaciones anteriores.

## Non-goals
- No importar foto/PDF/Excel ni OCR (0.8.x).
- No procesar voz/remoto, salidas de ayer u otros días, ni secuencias multiacción en una frase.
- No modificar horarios de Semana, compromisos fijos ni planes Move activos.
- No reorganización autónoma sin confirmación; no migración SQLite.

## Acceptance criteria
- AC1: Frases de salida pasada y hora válida proponen `record-actual-exit`, no cambios de turno.
- AC2: «Mañana salgo» y «viernes salgo» siguen cambiando horario de Semana; no se confunden con salida real.
- AC3: Día libre, fase previa/traslado, horas inválidas, fechas no actuales o múltiples cambios se rechazan sin escribir estado.
- AC4: Confirmar resuelve jornada vigente y reutiliza `correctActualExitTime`; si la jornada cambió tras la propuesta, devuelve conflicto sin escribir.
- AC5: Se registra `actualExit`, `actualExitAt`, `actualExitShiftKey`, y `actualExitReplanConfirmed` como «Ahora», sin modificar `WeekSchedule`.
- AC6: Si el reajuste necesita revisión, no se mueve lo flexible sin consentimiento; Asistente avisa que debe confirmar en «Ahora».
- AC7: «Deshacer cambio» restaura el DayState anterior solo si no cambió después; se sincronizan recordatorios.
- AC8: Tests puros, regresiones de estructura, Quality y build Android firmado pasan; versión y firma de actualización preservadas.

## Data / persistence impact
DayState canónico preexistente, sin migraciones ni claves nuevas. El recibo de undo permanece solo en memoria.

## UI/UX impact
Una frase y una propuesta breve en la pantalla del Asistente; no añadir un segundo resumen ni un panel permanente. Mensaje específico para revisiones pendientes.

## Edge cases / regression plan
Turno nocturno al cruzar medianoche; jornada libre; entrada futura, mensaje múltiple; hora invalidada; segundo cambio desde Ahora entre propuesta y confirmación; undo tras cambios desde otra pantalla; salidas reales ya registradas; no tocar fecha del turno en Semana.

## Verification
- Tests `tests/assistant-conversation.test.ts`, `tests/brain-actions.test.ts`, `tests/assistant-conversation-structure.test.cjs`; Quality CI de PR.
- Android firmado Release post-merge, control de versionCode y firma; instalación real en móvil permanece pendiente hasta probar APK.


## Verification progress (20-10-2026)
- AC1: PASS — test de «salí», «salí hoy» y «terminé mi turno» confirma intención de salida real y hora correcta.
- AC2: PASS — «mañana salgo» sigue generando un cambio de turno; sin confusión entre pasado y futuro.
- AC3: PASS — frases ambiguas, horas inválidas, fase previa, día libre, salidas antes del inicio y horas futuras se rechazan sin modificar estado.
- AC4: PASS — Brain invoca `correctActualExitTime` del dominio Ahora; verifica `shiftKey`, fin programado y hora real al confirmar.
- AC5: PASS — tests validan `actualExit`, `actualExitAt` y `actualExitShiftKey`, manteniendo WeekSchedule inmutable.
- AC6: PASS — caso de uso de Ahora requiere confirmación adicional para mover lo flexible; Asistente muestra «Revisar reajuste en Ahora» si corresponde.
- AC7: PASS — receipt/undo de DayState conserva protección de cambios posteriores y actualiza contexto/recordatorios.
- AC8: Quality CI #39390675259 PASS antes del último refuerzo nocturno; CI final y Android firmado: PENDING. QA física: BLOCKED hasta prueba en dispositivo.
- Regresiones adicionales: salida al cruzar medianoche, registro previo de otro turno y restricción de no mostrar copia redundante durante propuesta.
