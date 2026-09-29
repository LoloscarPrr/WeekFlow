# WeekFlow Alpha 0.4.5

- Completa el cierre compacto del Ritual de la Semana sin restaurar el bloque largo eliminado en versiones anteriores.
- Cuando la semana está abierta, Semana muestra un resumen breve y una única acción `Listo, organizar semana`.
- El cierre reutiliza `completeWeekRitual`, persiste `organizedAt` y refresca los recordatorios del plan.
- Una semana cerrada muestra `Listo. Tu semana ya está organizada.` con jornadas, días libres y tiempo programado.
- Editar horarios, colación, Trabajo/Libre o eventos importantes conserva el comportamiento existente: la semana se vuelve a abrir para revisión.
- No cambia OCR, Excel, PDF, SQLite, modelos, firma Android ni los datos ya guardados.
