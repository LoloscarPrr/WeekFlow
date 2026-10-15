# WeekFlow Alpha 0.5.12

## Menos ruido, más claridad
- Ahora presenta una única tarjeta «AHORA», sin duplicar el título «Qué importa ahora» ni el resumen Brain. Se conservan salida real, energía, traslado y próximos momentos.
- Rest retira el panel de reglas internas; la lógica de protección sigue igual.
- Semana, Food, Jardín, Hábitos, Asistente, Notificaciones y Bienvenida reducen encabezados, textos técnicos y explicaciones reiteradas.
- Se retira el rótulo visual obsoleto Alpha 0.5.5 de Ahora.

## Move
- Elimina el botón de versión más corta.
- Las nuevas sesiones parten desde 30 min, con opciones de 45 y 60.
- El feedback y la energía siguen ajustando la intensidad; la sesión no baja automáticamente de 30 min.
- Las rutinas de 45/60 min ocupan la duración elegida.
- Las sesiones e historiales anteriores se conservan.

## Integridad
- Sin cambios de esquema SQLite ni borrado de datos.
- Regresiones de UI, Move y continuidad de acciones actualizadas.
- Specs: WF-UX-002 y WF-MOVE-009.
- Verificación de CI/Android pendiente de completarse antes de publicar.
