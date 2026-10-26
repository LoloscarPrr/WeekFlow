# WF-NOTIFY-005 — Sincronización incremental de recordatorios

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: optimización técnica sin cambio de comportamiento visible · 2026-10-26

## Problem
Al abrir WeekFlow o cambiar un estado que afecta el plan, `performLivePlanReminderSync` enumera solicitudes existentes y luego vuelve a enumerarlas individualmente por recordatorio antes de cancelarlo y recrearlo. Esto causa llamadas nativas redundantes y churn de alarmas aun sin cambios.

## Desired behavior
Una sincronización lee las solicitudes nativas una vez; conserva exactamente una solicitud válida por ID lógico cuando fecha, título, cuerpo y categoría coinciden, cancela los duplicados/desactualizados, y crea solamente los faltantes o modificados.

## Roadmap fit
- Phase decision: NOW
- Reason: estabilización del núcleo y reducción de trabajo redundante en un sistema ya implementado, sin funcionalidad nueva.

## Scope
- `src/services/notifications.ts` y un helper puro reutilizable en `src/notifications/`.
- Pruebas de reconciliación y su incorporación a Quality.
- Compatibilidad con recordatorios legacy sin ID y con preferencias/silencio inteligente existentes.

## Non-goals
- Cambiar tiempos, categorías, permiso del sistema, visualización, textos, canales, prioridades, algoritmo de planificación o almacenamiento.
- Rehacer manual `scheduleReminder` ni otras áreas auditadas.
- Generar package-lock sin un entorno de resolución verificable.

## Acceptance criteria
- [x] AC1 — Plan sin cambios conserva solicitud equivalente y no genera reprogramaciones.
- [x] AC2 — Duplicados por ID conservan solo un ejemplar; modificaciones de fecha/texto/categoría reemplazan el anterior.
- [x] AC3 — Recordatorios retirados del plan se cancelan y solicitudes no reconocidas como WeekFlow se conservan.
- [x] AC4 — Solicitudes legacy equivalentes se eliminan, incluyendo las de categorías desactivadas cuando el plan canónico aún las identifica.
- [x] AC5 — Una sincronización completa consulta `getAllScheduledNotificationsAsync` solo una vez sin alterar cola/permiso/preferencias/smart silence.
- [ ] AC6 — Quality (typecheck + regresiones) pasa; Android signed build verificado cuando esté disponible.

## Data / persistence impact
None. El estado SQLite y los IDs lógicos no cambian.

## UI / UX impact
None. Se conservan la programación, títulos, textos, preferencias y permisos existentes.

## Edge cases / regressions
- Trigger nativo cuyo instante no puede reconstruirse: reemplazar por seguridad.
- Fecha/payload diferente con mismo ID lógico: reemplazar.
- Dos recordatorios idénticos: conservar uno; no volver a generar.
- Solicitudes antiguas sin ID reconocibles por título y horario: cancelar.
- Solicitudes no relacionadas y otras categorías: no afectar.
- Reentradas concurrentes: `livePlanSyncQueue` mantiene serialización.
- Pantallas hermanas: Ahora, Semana, Notificaciones, Habits y Rest.

## Verification plan
- [ ] Prueba pura con casos de mismo plan, duplicados, cambios, legacy, desconocidos y fecha no legible.
- [ ] Revisión estructural del servicio y `npm run quality` en CI.
- [ ] Android firmado o marcar BLOCKED si no se puede ejecutar.
- [ ] Validación visual/permiso en dispositivo físico: manual pendiente.

## Implementation notes
Decisiones de implementación en PR; conservar el armado canónico del plan y la cola de serialización.

## Verification result
- AC1: PASS — pruebas puras comprueban que se conserva el aviso nativo idéntico.
- AC2: PASS — pruebas puras comprueban deduplicación y reemplazo de fecha, título, cuerpo y categoría.
- AC3: PASS — pruebas verifican cancelación de obsoletos y preservación de solicitudes desconocidas.
- AC4: PASS — pruebas cubren legacy equivalentes y categorías desactivadas.
- AC5: PASS — revisión estática: performLivePlanReminderSync hace una consulta nativa y `scheduleNewReminder` no reenumera.
- AC6: PARTIAL — Quality pasó en v0.5.24 (#40349197233); revalidación v0.5.25 pendiente. Android signed build de este PR pendiente de integración.
- QA física: NOT RUN; requiere confirmación en dispositivo.
