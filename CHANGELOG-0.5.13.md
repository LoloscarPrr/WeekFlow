# WeekFlow Alpha v0.5.13

## Asistente — Brain 0.7.4
- Botón compacto «Deshacer cambio» después de confirmar un cambio efectivo de energía o turno.
- Reutiliza el recibo del Brain, sin guardar historial adicional de undo.
- Si energía u horario cambió en otra pantalla, evita sobrescribirlo y explica el conflicto.
- Refresca el contexto y los recordatorios al revertir un cambio.
- No presenta un deshacer para acciones sin cambios efectivos.
- Mantiene la confirmación explícita de cambios y la firma permanente para actualizar sobre 0.5.12.

## Calidad
- Pruebas ampliadas de undo de Semana y energía, conflicto y no-op.
- Quality CI y compilación Android firmada requeridas antes de cerrar la versión.
- Validación física de pantalla/actualización pendiente hasta instalar la APK en Android.

Spec: WF-BRAIN-004.
