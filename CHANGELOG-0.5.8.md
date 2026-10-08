# WeekFlow 0.5.8

## Silencio inteligente — paso 3

- Nueva opción “Proteger mi descanso” en Notificaciones.
- WeekFlow calcula próximas ventanas principales de descanso usando la misma lógica de Rest.
- Durante una ventana protegida, avisos secundarios de Food, Move o generales no se programan.
- Salida al trabajo, Rest y momentos importantes siguen permitidos como excepciones explícitas.
- La pantalla muestra la próxima ventana protegida cuando existe.
- La protección es reversible y está activada por defecto.
- No usa IA, aprendizaje automático ni cambia preferencias por su cuenta.

## Compatibilidad

- Sin migración de esquema SQLite.
- `notification-preferences` suma `smartSilence`; estados previos reciben `true` por sanitización.
- No cambia el cálculo de horarios de Rest, salida o eventos importantes.
- No se crean nuevas notificaciones Food/Move todavía.

Spec: `WF-NOTIFY-004`
