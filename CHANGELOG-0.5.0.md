# WeekFlow 0.5.0

## Habits + Jardín — primer núcleo ejecutable

- Jardín deja de ser solo navegación y permite crear hábitos flexibles.
- Cada hábito define una frecuencia semanal orientativa entre 1 y 7 veces, sin fijar días rígidos.
- Se puede guardar una mini-versión opcional para días difíciles.
- Hoy se puede registrar como `Hecho` o `Versión mini`; ambos cuentan como cumplimiento válido del día.
- Un hábito solo puede tener un registro por día y ese registro se puede deshacer.
- Los hábitos se pueden editar sin perder sus registros anteriores.
- Hábitos y completions se guardan localmente en la store SQLite existente bajo `habits-state`, sin migración de esquema.
- Jardín evita streaks, puntos y lenguaje punitivo; conserva los accesos a Descanso, Alimentación y Semana.
- El formulario reutiliza la infraestructura keyboard-aware para pantallas pequeñas.

Spec: `WF-HABIT-001`
