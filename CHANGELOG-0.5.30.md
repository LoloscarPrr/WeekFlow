# WeekFlow Alpha 0.5.30 — Move en «Lo que viene» de Ahora

## Cambios visibles
- Las sesiones del pilar Move **confirmadas por Brain** aparecen en «Ahora → Lo que viene», con hora, fecha, duración, intensidad y músculos de esa sesión.
- Tocando la fila se navega a **esa sesión confirmada**, para preparar el entrenamiento correcto sin alterar las preferencias generales y sin iniciarlo automáticamente.
- Una sesión confirmada no desaparece de la lista solo porque sea el primer momento destacado arriba o porque la hora prevista haya pasado durante el día. Aparece como pendiente, salvo si estás en trabajo/traslado/recuperación protegida.
- Al terminar una sesión, su registro asociado impide volver a mostrarla. Las sesiones futuras siguen visibles.
- Si Brain confirmó un plan Move para la semana, se ocultan las sugerencias genéricas de Move del día libre para que no contradigan el split.
- Se muestran fechas claras en filas de calendario cuando corresponde.
- La lista admite más actividades sin truncar arbitrariamente la próxima sesión Move.

## Corrección adicional
- El planificador semanal nuevo protege también el período previo a turnos diurnos (sueño/despertar, comida y preparación), no solo preparación y traslado. Evita insertar, por ejemplo, «Leer» a las 10:30 cuando Ahora indica comer a las 10:30 antes del turno de las 13:00.
- **Un plan ya confirmado no se mueve automáticamente.** Se debe volver a generar y confirmar la propuesta semanal para actualizar los bloques anteriores sin alterar silenciosamente el calendario.

## Límites
- «Ahora» muestra sesiones que existen en el plan semanal **confirmado**, no promesas del asistente ni entrenamiento de días sin programación.
- No es IA generativa remota; OpenAI sigue desactivado.
- No se reescriben turnos ni registros anteriores.
