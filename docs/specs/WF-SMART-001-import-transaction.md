# WF-SMART-001 — Transacción canónica de Smart Import

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-23
Blueprint: WeekFlow Blueprint Maestro v4.0, §15 y roadmap 0.8.x

## Problem
Las entradas actuales foto/captura, Excel y PDF producen una propuesta de siete días, pero cada componente guarda WeekSchedule por separado, sin control de cambios ocurridos entre lectura y confirmación, sin deshacer, y sin refresco explícito de recordatorios. Smart Import requiere una única fuente de verdad, confirmación humana y reversibilidad antes de añadir comprensión visual multimodal.

## Desired behavior
Tras leer un archivo, Brain crea una propuesta transaccional de la semana detectada. El usuario revisa solo lo dudoso, confirma una vez, la app comprueba que su semana no cambió desde la lectura y aplica la actualización completa sin tocar momentos fijos ni otros estados. Ofrece «Deshacer importación» en la sesión, seguro ante ediciones posteriores. Notificaciones se resincronizan después de aplicar o deshacer. Ambas entradas existentes (imagen/Excel y PDF) usan exactamente el mismo caso de uso.

## Roadmap fit
- Phase decision: NOW, inicio de 0.8.x Smart Import.
- Reason: la capa transaccional es necesaria antes de sustituir OCR clásico por lectura multimodal; evitar otro almacén y otro motor. No se afirmará que exista IA multimodal en producción.

## Scope
- Servicio puro `src/brain/smartImport.ts` para validar siete días, horas/colación, días libres, nombre hallado, ambigüedad y origen.
- Propuesta lleva snapshot canónico anterior; apply confirma solo si sigue idéntico. Persiste únicamente Semana mediante `saveWeekState` ya existente.
- Copia momentos fijos y marca `organizedAt:null` para reorganización posterior según fuentes canónicas de Brain/Rest/Move/Habits; no promete mover bloques sin replan confirmado.
- Undo restaura la semana anterior solo si el estado aplicado permanece idéntico; nunca borra ediciones posteriores.
- Mismo servicio desde `ScheduleImportCard` y `SchedulePdfImportCard`, y sincronización de recordatorios.
- Resumen de siete días existente conservado; nueva pantalla de resultado compacta con undo.
- Android 0.5.19, mismo package, firma, source versionCode 111. QA física por lotes.

## Non-goals
- Todavía no agrega backend de IA multimodal ni envía fotos a terceros; lectura local OCR/Excel/PDF sigue provisional como proveedor de entrada.
- No crear otra importación clásica ni escribir parsers nuevos basados en Aramco.
- No autoelegir fila ambigua ni completar valores dudosos silenciosamente; no marcar `organizedAt` como completado sin ritual.
- No tocar DayState, Move, Food, Rest, hábitos, compromisos ni esquema SQLite.

## Acceptance criteria
- AC1: ambas vías de importación usan la misma transacción pura Brain para comprobar y guardar una semana.
- AC2: siete días únicos ordenados, HH:MM válidas, duración de colación 0–180, día libre coherente, turnos que cruzan medianoche; rechazo de días incompletos, nombre no verificado y problemas activos.
- AC3: `00:00` solo representa libre cuando `off=true`; no convierte horas de colación ni ceros ambiguos en jornada inventada.
- AC4: no se escribe nada sin confirmación; si Semana cambió después de leer, se presenta conflicto y no se sobrescribe.
- AC5: tras confirmar conserva `importantMoments`, marca semana para revisar/reorganizar y sincroniza recordatorios, sin modificación de otros pilares.
- AC6: undo funciona y restaura semana anterior solo si no hubo edición posterior; no borra el cambio posterior.
- AC7: UI informa resultado y ofrece undo sin pedir volver a corregir toda la tabla; manual sigue disponible.
- AC8: Quality CI + Android release firmado 0.5.19; QA dispositivo agrupada pendiente por preferencia del usuario.

## Future 0.8.x
Integrar proveedor de comprensión visual multimodal real sobre este contrato con identidad/fechas/ambigüedad explícitas y comparación de día/semana, sin duplicar el importador. Hasta entonces las lecturas de captura dependen de OCR local y no se venden como IA multimodal.

## Verification
PENDING.
