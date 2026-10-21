# WF-BRAIN-009 — Explicar el impacto de una salida real

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-21
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
El usuario registra «salí una hora tarde», pero la tarjeta y el resultado del Asistente son genéricos: no explican cómo cambia el regreso, la recuperación ni qué bloque flexible necesita confirmación. El Blueprint exige que Brain explique antes de mover lo flexible y mantenga compromisos fijos. Además, el cálculo existente del desfase en turnos diurnos puede interpretar 00:30 del día siguiente como 21h30 *antes* de las 22:00 al comparar HH:MM sin fechas.

## Desired behavior
Antes de confirmar una salida real (horario absoluto o desfase relativo), el Asistente presenta un resumen corto y sustentado: hora real, diferencia respecto del fin programado FECHADO, llegada estimada, comienzo de recuperación y si los bloques flexibles necesitan confirmación. Luego de confirmar, actualiza ese mismo resumen con el estado canónico de Ahora. Los bloques fijos nunca se mueven silenciosamente y el enlace «Revisar reajuste en Ahora» sigue disponible solo cuando corresponde.

## Roadmap fit
- Phase decision: NOW.
- Reason: Blueprint v4.0 §14 0.7.x: «Reorganizar actividades flexibles», «Explicar por qué propone un cambio», «saber quedarse callado». Cierra esta capacidad antes de Smart Import 0.8.x.

## Scope
- Calcular delta real usando `actualExitAt` y `shiftContext.endAt` con fecha, evitando confundir 00:30 del día siguiente y respetando turnos 22:00–06:00.
- Mantener el cálculo anterior de `assessExitReplanImpact` como fallback para consumidores sin fechas, sin modificar la programación base.
- Conectar la fecha prevista al registro de salida de «Ahora» y Brain Action; así ambos módulos interpretan igual el desfase.
- Crear un helper puro para explicar el impacto canónico, sin un nuevo plan ni un segundo motor.
- Mostrar resumen en tarjeta *existente* de confirmación y al finalizar, sin paneles ni mensajes redundantes. Identificar regreso como estimación y no como ubicación conocida.
- Mantener revisión adicional de bloques flexibles solamente cuando `requiresConfirmation` del Brain lo determine.
- Mantener cambios de energía, turnos, Food, preguntas del estado, undo y notificaciones como hoy.
- Versión técnica 0.5.18, mismo paquete Android/firma, source versionCode 110. Un único build con gate Quality CI; QA física por lote, no por microversión.

## Non-goals
- No reorganizar compromisos fijos, cambiar duración de Move ni inventar disponibilidad; no modelos remotos ni Smart Import/OCR.
- No crear historial persistente de explicaciones, migración SQLite ni pantallas de ayuda.
- No reinterpretar fechas de salidas registradas en otra jornada (el guard de turno sigue aplicándose).
- No validar manualmente cada build en teléfono: será QA por lotes posteriores.

## Acceptance criteria
- AC1: propuesta absoluta y relativa calculan igual el impacto cuando dan la misma hora real, sin escribir datos antes de confirmar.
- AC2: salida 13:00–22:00 a las 00:30 del día siguiente muestra **+150 minutos**, no -1290; cruce nocturno 22:00–06:00 a 07:00 muestra +60 min.
- AC3: el resumen menciona hora real, diferencia real, estimación de llegada, recuperación y necesidad de revisión *solo* si el motor lo exige.
- AC4: una salida sin bloque flexible que mover no pide confirmación extra; compromisos fijos no se cambian.
- AC5: tras confirmar el Asistente lee el estado canónico de Ahora y presenta la explicación; sigue visible enlace a Ahora si hay revisión pendiente.
- AC6: propuestas obsoletas, salidas de futuro, antes de empezar, días libres o cruces de medianoche erróneos se rechazan sin guardar.
- AC7: regresiones de otros módulos, notificaciones, undo y flujos absolutos/relativos previos pasan.
- AC8: Quality CI y Android release firmado 0.5.18 PASS; QA física: PENDING para prueba agrupada futura, no gate obligatorio del desarrollo.

## Data/persistence impact
Sin esquema/clave nuevos: mismo `DayState.actualExitAt` y `actualExitShiftKey`. Se conectan fechas solo como parámetros efímeros entre use cases.

## UX impact
Una explicación corta en tarjeta ya existente y mensaje posterior; no nuevas tarjetas. «Revisar reajuste en Ahora» conserva acción de decisión explícita.

## Edge cases
Salida de noche/madrugada, horario diurno prolongado sobre medianoche, entrada futura, salida temprana y desfase cero, plan sin bloques flexibles, energía agotada, resto del día vacío; bloqueo sin sobreescribir cambios posteriores.

## Verification plan
Pruebas puras `tests/assistant-exit-explanation.test.ts`, ampliar regresiones de fecha en `tests/regression.test.ts`, checks estructurales y TypeScript. PR Quality y post-merge signed release. QA física diferida por petición expresa del usuario (menos micropruebas).

## Verification evidence — 2026-10-21
- AC1: PASS — salida exacta y relativa usan la misma propuesta, el mismo use case `correctActualExitTime` y la misma función de impacto; la vista previa no llama persistencia.
- AC2: PASS — `assistant-exit-explanation.test.ts` cubre 13:00–22:00 → 00:30 del siguiente día (+150 min), jornada 22:00–06:00 → 07:00 (+60 min), salidas tempranas y fallback de compatibilidad.
- AC3: PASS — el helper `describeExitImpact` usa `ExitReplanImpact` para hora real, diferencia, regreso estimado, recuperación y revisión requerida; pruebas de texto y estimaciones.
- AC4: PASS — caso sin bloques flexibles (energía agotada) no exige revisión extra; `replanAfterActualExit` mantiene fijo `item.flexible=false` y solo opera detrás del índice de regreso.
- AC5: PASS (código y estructura) — confirmación lee `getNowView` posterior al guardado; `app/assistant.tsx` conserva enlace a Ahora en caso `needsExitReview`.
- AC6: PASS — se conservan guardas existentes de jornada/fase/hora y se valida también en propuesta antes de confirmar.
- AC7: PASS — Quality PR #39664812446 completado en verde, incluyendo tests de Brain, Food, Rest, Now, notificaciones y regresión nueva.
- AC8: Quality PR PASS; Android release firmado de 0.5.18 PENDING hasta ejecución post-merge; QA física NOT RUN por decisión de usar pruebas por lote en vez de micropruebas.
- Ninguna migración SQLite, módulo nuevo ni dependencia Android.
