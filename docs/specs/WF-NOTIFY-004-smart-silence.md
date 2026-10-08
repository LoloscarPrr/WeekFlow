# WF-NOTIFY-004 — Silencio inteligente y descanso protegido

Status: LOCKED
Owner: WeekFlow
Approved scope: Oscar · 08-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
WeekFlow ya permite elegir qué categorías de recordatorio recibir, pero todavía no existe una política contextual que evite interrupciones secundarias durante una ventana principal de descanso.

## Desired behavior
WeekFlow calcula ventanas de descanso protegidas a partir de la misma lógica de Rest. Dentro de esas ventanas:
- recordatorios secundarios (`food`, `move`, `general`) se suprimen;
- `important`, `departure` y `rest` permanecen permitidos por ser recordatorios explícitos y explicables;
- la política puede desactivarse desde Notificaciones;
- la pantalla muestra la próxima ventana protegida cuando exista.

La regla debe ser determinista y explicable. No usa IA ni aprende silenciosamente hábitos.

## Roadmap fit
- Phase decision: NOW
- Reason: tercer bloque canónico de 0.6.x, después del onboarding y las preferencias de notificación.

## Scope
- Añadir `smartSilence` a preferencias.
- Calcular ventanas principales de descanso para próximos turnos usando `restWindowForShift`.
- Política pura de interrupción para decidir si un recordatorio puede programarse.
- Aplicar la política tanto a `scheduleReminder` como al resync del plan vivo.
- Mostrar control “Proteger mi descanso” en `/notifications`.
- Mostrar próxima ventana protegida cuando exista.
- Mantener recordatorios importantes/salida/Rest como excepciones visibles y documentadas.
- Cerrar WF-NOTIFY-003 con evidencia Android #166.

## Non-goals
- IA/Brain predictivo.
- Aprendizaje automático de horarios.
- Horarios manuales de “no molestar”.
- Bloquear llamadas/mensajes de otras apps.
- Cambiar cálculo de sueño.
- Crear nuevas notificaciones Move/Food en esta spec.
- Silenciar eventos importantes automáticamente.

## Acceptance criteria
- [ ] AC1 — Preferencias incluyen `smartSilence`, activado por defecto.
- [ ] AC2 — Se generan ventanas protegidas coherentes con `restWindowForShift`.
- [ ] AC3 — `food`, `move` y `general` dentro de una ventana protegida se suprimen cuando smartSilence está activo.
- [ ] AC4 — `important`, `departure` y `rest` no se suprimen por smartSilence.
- [ ] AC5 — Con smartSilence apagado, la política no suprime recordatorios por descanso.
- [ ] AC6 — La pantalla Notificaciones expone “Proteger mi descanso”.
- [ ] AC7 — La pantalla muestra la próxima ventana protegida si existe.
- [ ] AC8 — La decisión queda cubierta por tests puros y estructurales.
- [ ] AC9 — Sin migración de schema SQLite.
- [ ] AC10 — Quality y Android release pasan antes de declarar DONE.

## Data / persistence impact
Se extiende la clave existente `notification-preferences` con:
- `smartSilence: boolean`

La sanitización rellena `true` para datos legacy que aún no tengan ese campo.

## UI / UX impact
La pantalla Notificaciones agrega una sección:
- “Proteger mi descanso”
- explicación breve de qué se silencia y qué no;
- próxima ventana protegida, si se puede calcular.

## Edge cases / regressions
- Turno nocturno.
- Ventana que cruza medianoche.
- Dos turnos cercanos.
- Sin turno futuro.
- Preferencias antiguas sin `smartSilence`.
- Recordatorio justo en el borde de la ventana.
- Recordatorio importante dentro de la ventana protegida.

## Verification plan
- Tests puros de ventanas y política.
- Test estructural de UI y servicio.
- Quality en PR.
- Merge solo en verde.
- Android firmado post-merge.
- Prueba física de comportamiento del sistema queda manual.
