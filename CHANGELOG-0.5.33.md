# WeekFlow Alpha 0.5.33 — Jardín conectado y Move más útil

## Jardín
- Las cinco tarjetas antes inertes (Relaciones, Bienestar, Hogar, Responsabilidades, Tiempo personal) ahora usan los **hábitos reales y sus cumplimientos de esta semana**.
- Cada hábito puede tener una categoría de Jardín desde Crear/Editar hábitos; la categoría no cambia su frecuencia, planificación o historial.
- Los nombres heredados muy claros (por ejemplo, Relación amorosa, Hacer aseo habitación, Leer) tienen una **categoría sugerida**, editable sin migración destructiva. Si no hay categoría, se indica «Sin hábitos asignados · Toca para configurar», no una estadística inventada.
- Tocar cualquier tarjeta abre el administrador de Hábitos con la categoría preseleccionada para crear un hábito, o para editar uno existente.
- Movimiento distingue sesiones completadas de sesiones semanales programadas por Brain: «0 realizadas · N programadas» cuando corresponde. No hace pasar el plan por entrenamiento realizado.
- Descanso y Alimentación mantienen sus registros existentes. No se calculan puntuaciones de salud o relaciones a partir de hábitos.

## Move
- El catálogo crece con **12 ejercicios adicionales** realistas para casa y equipo básico (curl alternado, curl concentrado, remo apoyado, press en suelo, sentadilla isométrica, puentes de glúteos, trabajo de core, etc.).
- Para sesiones de **fuerza** con mancuernas registradas y permitidas, el selector prioriza opciones con ese equipo antes de curl de autorresistencia. No recomienda material no registrado ni fuerza con cargas en recuperación.
- Se conserva autorresistencia como alternativa cuando no hay peso disponible o la configuración exige menos carga.
- Conserva la rotación según ejercicios realizados, duración, grupos musculares y limitaciones de esfuerzo.

## Seguridad y compatibilidad
- Hábitos y SQLite anteriores siguen válidos; asignar una categoría no modifica semanas confirmadas.
- Sin IA remota, costos ni cambios a WeekFlow Pills.
- Quality y Android Metro deben aprobar antes de fusionar.
