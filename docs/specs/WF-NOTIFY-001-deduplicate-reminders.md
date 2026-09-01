# WF-NOTIFY-001 — Deduplicar recordatorios locales

Status: LOCKED
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
- Añadir una prueba/regresión automatizable de la lógica de deduplicación cuando sea práctico.

## Non-goals
- Cambiar textos, anticipación de 30 minutos o permisos.
- Añadir push notifications/FCM.
- Cancelar notificaciones de otras aplicaciones o solicitudes no identificables como WeekFlow.

## Acceptance criteria
- [ ] AC1 — Dos llamadas concurrentes a `syncLivePlanReminders` no dejan dos solicitudes para el mismo reminder lógico.
- [ ] AC2 — Una solicitud heredada equivalente a `Tu jornada empieza pronto` sin `weekflowReminderId` se elimina al resincronizar.
- [ ] AC3 — Tras sincronizar, cada reminder deseado tiene como máximo una solicitud nativa programada.
- [ ] AC4 — Solicitudes no reconocidas como WeekFlow se preservan.
- [ ] AC5 — Los IDs lógicos actuales y el horario/texto funcional no cambian.
- [ ] AC6 — Quality pasa.

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
- [ ] Revisar diff.
- [ ] Verificar deduplicación lógica y legado.
- [ ] Ejecutar Quality en PR.
- [ ] Confirmar que el build nativo no se altera fuera de esta corrección.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
