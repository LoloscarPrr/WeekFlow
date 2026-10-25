# WeekFlow Alpha 0.5.22 — Smart Import 0.8.4

## Revisión de siete días, concentrada
- Capturas, Excel y PDF comparan la propuesta con la Semana existente sin duplicar planes ni guardar automáticamente.
- Muestra siempre siete días, pero con horarios y etiquetas compactas: «Cambió», «Sin cambios» o «Revisar».
- Destaca el horario anterior de días que cambian, incluyendo colación y días libres.
- Los días con lectura incierta o dato inválido muestran sus editores de inmediato; los demás solo se abren al pulsar Editar.
- Acciones «Editar todos» y «Ocultar listos» para revisar rápido o inspeccionar con detalle.
- Usa exactamente el validador canónico del Brain: las contradicciones en «LIBRE», colaciones faltantes o confianza baja **bloquean confirmación**, incluso para días libres.
- Mantiene las mismas acciones de confirmación/undo y preserva momentos importantes y modificaciones posteriores.
- Sin migraciones SQLite, paquetes ni firma nuevos. La lectura de IA remota sigue desactivada hasta configurar el servidor y autorización del propietario.

## Calidad
- Pruebas de diferencias, días sin cambios, turnos nocturnos, colación 0, faltantes, duplicados y errores.
- Checks estructurales garantizan la misma UX y persistencia compartida en todos los formatos.
- Quality CI y signed Android 0.5.22 se verifican por separado. QA física agrupada.
Spec: WF-SMART-004.
