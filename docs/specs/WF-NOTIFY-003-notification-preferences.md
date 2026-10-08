# WF-NOTIFY-003 — Preferencias de notificaciones

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 08-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
WeekFlow ya genera recordatorios de salida al trabajo, momentos importantes y Rest, pero hoy no existe una forma clara de decidir cuáles recibir. Además, una instalación nueva no debería pedir permiso de notificaciones antes de que el usuario elija activarlas.

## Desired behavior
El usuario puede gestionar notificaciones desde Asistente con un interruptor maestro y tres categorías independientes:
- salida al trabajo;
- momentos importantes;
- Rest.

Cambiar una preferencia resincroniza inmediatamente los recordatorios futuros. Desactivar una categoría elimina sus recordatorios programados. Desactivar todo evita pedir permiso y cancela los recordatorios gestionados por WeekFlow.

## Roadmap fit
- Phase decision: NOW
- Reason: es el segundo bloque canónico de 0.6.x, posterior al onboarding mínimo y previo al silencio inteligente/contextual.

## Scope
- Nueva pantalla `/notifications`.
- Entrada “Notificaciones” en Asistente.
- Persistencia local de preferencias sin migración de esquema.
- Interruptor maestro.
- Interruptores para `departure`, `important` y `rest`.
- Filtrar el plan de recordatorios según preferencias antes de programar.
- Resincronizar al guardar cambios.
- Fresh installs: notificaciones apagadas hasta elección explícita.
- Legacy installs: conservar recordatorios habilitados por defecto para no romper comportamiento existente.
- Si todo está apagado, no solicitar permiso del sistema.

## Non-goals
- Silencio inteligente.
- Horas de no molestar.
- IA/Brain para decidir qué notificar.
- Push remoto/FCM.
- Nuevas categorías de Food/Move.
- Cambiar el cálculo de horarios de recordatorios.

## Acceptance criteria
- [ ] AC1 — Fresh install sin preferencias inicia con master apagado.
- [ ] AC2 — Instalación legacy sin preferencias conserva master y categorías habilitadas.
- [ ] AC3 — Asistente muestra acceso a Notificaciones.
- [ ] AC4 — Pantalla permite controlar master, salida, importantes y Rest.
- [ ] AC5 — Master apagado impide solicitar permiso y cancela recordatorios gestionados.
- [ ] AC6 — Categoría apagada no se programa y recordatorios previos de esa categoría se eliminan al resync.
- [ ] AC7 — Categorías habilitadas conservan la lógica horaria existente.
- [ ] AC8 — Cambiar preferencias dispara resync y muestra feedback comprensible.
- [ ] AC9 — Persistencia usa `weekflow_state` sin migración de schema.
- [ ] AC10 — Quality y Android release pasan antes de declarar DONE.

## Data / persistence impact
Nueva clave `notification-preferences` en el store key/value SQLite.

Formato:
- `enabled: boolean`
- `departure: boolean`
- `important: boolean`
- `rest: boolean`

No se modifican WeekState, DayState ni cálculos del reminder plan.

## UI / UX impact
Pantalla compacta en Asistente:
- “Notificaciones” como título;
- explicación de que WeekFlow avisa solo de momentos concretos;
- master “Permitir recordatorios de WeekFlow”;
- categorías debajo;
- copy explícito de que el permiso Android solo se pedirá al activar recordatorios.

## Edge cases / regressions
- Permiso del sistema denegado.
- Master apagado con categorías individualmente activas.
- Reencender master después de denegar permiso.
- Legacy install sin estado persistido.
- Fresh install completó onboarding pero nunca abrió preferencias.
- Recordatorios ya programados de una categoría que luego se apaga.
- Reinicio de app con preferencias guardadas.

## Verification plan
- Tests puros de defaults fresh/legacy y filtrado por categoría.
- Test estructural de pantalla/Asistente/servicio.
- Quality en PR.
- Merge solo en verde.
- Android firmado post-merge.
- Permiso real Android y cancelación visible: prueba física manual.


## Verification result

- AC1: PASS — fresh install usa fallback master apagado.
- AC2: PASS — legacy install usa fallback con master/categorías activas.
- AC3: PASS — Asistente expone acceso a `/notifications`.
- AC4: PASS — pantalla incluye master + departure + important + rest.
- AC5: PASS — master se evalúa antes de `initializeNotifications()` y cancela programados.
- AC6: PASS — el plan se filtra por categoría y resync elimina IDs no deseados.
- AC7: PASS — `buildLivePlanReminders` no fue modificado; se conserva lógica horaria existente.
- AC8: PASS — cada cambio persiste y llama `syncLivePlanReminders()`.
- AC9: PASS — estado usa key/value `notification-preferences`, sin migración SQLite.
- AC10: PARTIAL — Quality #251 PASS; Android firmado pendiente post-merge.

Additional:
- PASS — pruebas puras cubren defaults fresh/legacy y filtro por tipo.
- PASS — prueba estructural cubre Asistente, navegación, master-before-permission y persistencia.
- BLOCKED — interacción real con permiso Android/cancelación visible requiere teléfono físico.
