# WF-BRAIN-006 — Salidas relativas en el Asistente

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-20
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problema
El Blueprint indica que Asistente debe entender cambios reales como «salí una hora tarde». La versión 0.5.14 admite «hoy salí a las 22:30», pero no puede interpretar una diferencia relativa respecto de la salida programada. Solicitar hora exacta en ese caso aumenta la carga mental innecesariamente.

## Comportamiento deseado
Aceptar frases inequívocas «salí una hora tarde», «salí 30 minutos antes» o «terminé mi turno media hora tarde». Transformar el desfase respecto al fin **fechado** de la jornada que ofrece Ahora y generar la misma propuesta `record-actual-exit` de 0.7.5, con hora concreta y confirmación humana. Rechazar desfases no interpretables o >180 minutos. Conservar corrección de medianoche, restricciones horarias y deshacer.

## Fit del roadmap
- Phase decision: NOW.
- Reason: Brain/Assistant 0.7.x, literal en Blueprint (entradas: «salí una hora tarde»); mejora la captura de hechos reales sin iniciar 0.8 Smart Import.

## Alcance
- Interpretación determinista de «salí / terminé mi turno» + desviación exacta en horas/minutos, antes/tarde; no inferir intenciones vagas.
- Calcular hora a partir del `shiftContext.endAt` fechado del mismo motor de Ahora, nunca desde «hora actual», evitando error de medianoche.
- Reutilizar intacta la propuesta canónica de 0.7.5, su validación de identidad de turno, confirmación, guardado, revisión de reajuste y reversión segura.
- Mensaje de propuesta claro con hora calculada, signo/desfase y sin copy duplicado.
- Android 0.5.15, mismo package/firma y versionCode monotónico.
- Pruebas puras y estructurales de parser, offset, cruce de medianoche, desfases inválidos y regresión de hora explícita.

## No objetivos
- No texto/voz abiertos, ni conversación de varios cambios, ni auto-aplicar.
- No modificar reglas de Brain/Move/Rest ni la Semana planificada.
- No OCR, Excel, importación tradicional ni Smart Import.
- No nuevos esquemas SQLite ni colas de undo.

## Criterios de aceptación
- AC1: «salí una hora tarde» → +60, «salí 30 minutos antes» → −30; «terminé mi turno media hora tarde» → +30.
- AC2: Se calcula hora contra `shiftContext.endAt` real; una jornada 22:00–06:00 con +60 produce 07:00 del día siguiente, no 07:00 del día anterior.
- AC3: Frases ambiguas, múltiples acciones, 0 min, desfases >180 min, día libre, jornada sin fin, hora futura o anterior al inicio no producen cambios.
- AC4: Propuesta confirma hora concreta y desfase de forma compacta; no toca semana ni registra la salida sin confirmación.
- AC5: Confirmación, guardado, reajuste flexible pendiente en Ahora, recordatorios y deshacer usan código canónico de 0.7.5.
- AC6: «mañana salgo» y «hoy salí a las HH:MM» mantienen comportamiento previo; regresiones incluidas.
- AC7: Quality CI y Android Release firmado con APK/AAB; mismo paquete y datos.

## Datos/UI
Sin persistencia adicional. La UI existente del Asistente muestra una sola tarjeta confirmable; ningún panel nuevo.

## Riesgos y QA
Comprobar turno tarde/noche, salida antes del fin previsto estando aún en jornada, cruce de medianoche, desfase futuro y «salí a las» exacto. Si el desfase apunta a una fecha ajena al turno, no crear propuesta. QA visual y de actualización de APK en teléfono queda pendiente del usuario.

## Verificación
Pendiente.
