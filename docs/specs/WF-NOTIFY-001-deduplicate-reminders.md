# WF-NOTIFY-001 — Deduplicar recordatorios locales

Status: DONE
Owner: WeekFlow

## Problem
En Android se observaron dos notificaciones visibles idénticas de `Tu jornada empieza pronto` para la misma jornada y la misma hora. La sincronización actual deduplica solicitudes que ya llevan `weekflowReminderId`, pero no limpia solicitudes WeekFlow heredadas o ya programadas por builds anteriores sin ese identificador lógico. Además, dos sincronizaciones concurrentes pueden ejecutar cancelar+programar al mismo tiempo y volver a apilar el mismo recordatorio.

## Desired behavior
Para una jornada/recordatorio lógico, WeekFlow debe mantener como máximo una solicitud local programada. Reabrir la app, resincronizar el plan o actualizar desde una build anterior no debe producir notificaciones duplicadas.

## Scope
- Serializar las sincronizaciones de recordatorios para evitar carreras dentro del proceso.
- Reconocer solicitudes WeekFlow heredadas por contenido/trigger cuando no tengan `weekflowReminderId`.
- Limpiar duplicados y solicitudes heredadas equivalentes antes de programar el conjunto deseado.
- Mantener intactos recordatorios ajenos a WeekFlow.

## Non-goals
- Cambiar textos, anticipación de 30 minutos o permisos.
- Añadir push notifications/FCM.
- Cancelar notificaciones de otras aplicaciones o solicitudes no identificables como WeekFlow.

## Acceptance criteria
- [x] AC1 — Dos llamadas concurrentes a `syncLivePlanReminders` no dejan dos solicitudes para el mismo reminder lógico.
- [x] AC2 — Una solicitud heredada equivalente a `Tu jornada empieza pronto` sin `weekflowReminderId` se elimina al resincronizar.
- [x] AC3 — Tras sincronizar, cada reminder deseado tiene como máximo una solicitud nativa programada.
- [x] AC4 — Solicitudes no reconocidas como WeekFlow se preservan.
- [x] AC5 — Los IDs lógicos actuales y el horario/texto funcional no cambian.
- [x] AC6 — Quality pasa.

## Data / persistence impact
Ninguno. Solo cambia la reconciliación de solicitudes locales de expo-notifications.

## UI / UX impact
Se elimina la duplicación visible de notificaciones.

## Edge cases / regressions
- Actualización desde APK antigua con notificaciones ya programadas.
- Dos efectos/resumes que disparen sincronización casi simultáneamente.
- Jornadas movidas o eliminadas deben seguir limpiándose.
- No tocar solicitudes ajenas a WeekFlow.

## Verification plan
- [x] Revisar diff.
- [x] Verificar deduplicación lógica y legado.
- [x] Ejecutar Quality en PR.
- [x] Confirmar que no se modifican archivos de build/configuración nativa en esta corrección.

## Verification result
- AC1: PASS — `livePlanSyncQueue` serializa llamadas concurrentes a la reconciliación.
- AC2: PASS — `isLegacyEquivalent` y `cancelEquivalentReminder` eliminan equivalentes heredados por título, cuerpo y trigger.
- AC3: PASS — cada reminder se reconcilia cancelando equivalentes antes de programar una única solicitud nueva.
- AC4: PASS — solicitudes sin ID lógico y no equivalentes a un reminder deseado no se cancelan.
- AC5: PASS — IDs `shift-*` / `important-*`, textos y anticipaciones no fueron modificados.
- AC6: PASS — GitHub Actions Quality #99 completó con success sobre el head del PR #71.
