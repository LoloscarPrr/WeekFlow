# WeekFlow Alpha v0.5.14

## Assistant + Brain 0.7.5
- El Asistente diferencia «salí a las 22:30» (salida real) de «mañana salgo a las 22:30» (cambio de horario semanal).
- Las salidas reales se confirman antes de aplicarse y usan el mismo motor de Ahora para actualizar regreso y recuperación, sin alterar la jornada programada.
- Un reajuste importante de bloques flexibles se deja pendiente de confirmación en Ahora; existe enlace directo para revisarlo.
- Protección ante turnos que cambian entre la propuesta y la confirmación, día libre, salida prematura, horas inválidas y peticiones ambiguas.
- El nuevo registro conserva la posibilidad de Deshacer cambio con control de conflictos.
- Sin importación multimodal, nuevos datos paralelos ni cambios al mínimo de Move de 30 minutos.

## Verificación
- Pruebas de interpretación, Brain Actions/undo y estructura UI ampliadas.
- Release Android firmado y QA en dispositivo requeridos antes del cierre total.

Spec: WF-BRAIN-005
