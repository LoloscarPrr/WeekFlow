# WF-NOTIFY-002 — Notificaciones para salida, eventos y Rest

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 23-09-2026
Source: validación física Android de WeekFlow Alpha v0.3.26

## Problem

Tres momentos visibles y accionables en WeekFlow necesitan llegar como notificación del sistema:
1. "Salir hacia el trabajo" muestra una hora calculada con traslado + margen, pero el recordatorio actual usa una anticipación fija respecto de la entrada.
2. Los eventos importantes deben recordar el compromiso guardado sin depender de tener WeekFlow abierto.
3. Rest muestra un "Cierre orientativo" calculado desde la próxima entrada, pero no existe recordatorio para empezar a bajar el ritmo.

## Desired behavior

- Salida al trabajo: notificación exactamente a la hora de salida que usa el Brain: entrada - traslado de ida - margen.
- Evento importante: una notificación 15 min antes; si se crea con menos de 15 min de anticipación, se programa a la hora del evento.
- Rest: notificación exactamente en el cierre orientativo (45 min antes de la ventana base de descanso) usando el mismo cálculo que la pantalla Rest.
- Reprogramar turnos, eventos o ajustes del día actualiza los recordatorios sin duplicados.
- No tocar las dos UI ya validadas de Cuenta y Move.

## Scope

- Extraer un plan puro de recordatorios para poder probar horarios sin depender de Expo Notifications.
- Programar salida al trabajo para próximos turnos dentro del horizonte existente.
- Programar eventos importantes.
- Programar cierres Rest.
- Resincronizar recordatorios cuando cambia DayState además de cuando cambia Semana.
- Mantener canal Android, sonido y deduplicación existentes.
- Bump 0.3.27 + Quality + Android release.

## Non-goals

- No push remoto/Firebase Cloud Messaging.
- No notificación para cada bloque del Brain.
- No alarma persistente/full-screen.
- No múltiples avisos por evento importante.
- No cambiar cálculo de sueño, traslado o margen.
- No modificar UI de Move/Cuenta.

## Acceptance criteria

- [ ] AC1 — Una entrada 13:00 con 75 min de traslado + 15 min de margen produce salida/notificación 11:30.
- [ ] AC2 — El título/cuerpo de salida explican entrada, traslado y margen.
- [ ] AC3 — Evento 13:30 produce recordatorio 13:15 si todavía es futuro.
- [ ] AC4 — Evento creado dentro de los 15 min previos se programa a la hora del evento, no en el pasado.
- [ ] AC5 — Rest usa exactamente la misma lógica de wake/sleep/wind-down que la pantalla y notifica en Cierre orientativo.
- [ ] AC6 — La notificación Rest incluye hora de descanso/despertar/entrada como contexto.
- [ ] AC7 — Resync conserva como máximo una solicitud por reminder lógico y elimina horarios anteriores del mismo ID.
- [ ] AC8 — Cambios de WeekState y DayState disparan resync.
- [ ] AC9 — Quality/TypeScript/regresiones pasan.
- [ ] AC10 — Android release 0.3.27 genera APK + AAB firmados.

## Verification result

- AC1–AC10: PENDING
