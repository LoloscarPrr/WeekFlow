# WeekFlow 0.5.7

## Notificaciones — paso 2

- Nueva pantalla de preferencias en Asistente.
- Interruptor maestro para los recordatorios de WeekFlow.
- Controles independientes para salida al trabajo, momentos importantes y Rest.
- Cambios de preferencia resincronizan inmediatamente los recordatorios.
- Desactivar una categoría elimina sus avisos futuros del plan.
- Desactivar el master cancela recordatorios y no solicita permiso Android.
- Fresh installs parten con notificaciones apagadas hasta activación explícita.
- Instalaciones legacy conservan recordatorios habilitados por defecto.

## Compatibilidad

- Sin migración de esquema SQLite.
- Preferencias guardadas en `notification-preferences` dentro de `weekflow_state`.
- No cambia el cálculo horario de salida, eventos ni Rest.
- No se implementa todavía silencio inteligente.

Spec: `WF-NOTIFY-003`
