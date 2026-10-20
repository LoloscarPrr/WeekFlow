# WeekFlow Alpha v0.5.15

## Brain 0.7.6 — salidas relativas
- «Salí una hora tarde», «salí 30 minutos antes» o «terminé mi turno media hora tarde» se traducen a una hora real desde el fin fechado de la jornada actual.
- La propuesta presenta hora y desfase antes de cualquier cambio. La confirmación usa la acción ya existente de salida real de Ahora.
- Se protege el cruce de medianoche; se rechazan fechas fuera de la jornada, salidas que todavía no ocurrieron, frases ambiguas y desfases extremos.
- Persistencia SQLite, horario semanal, Move mínimo 30 minutos, reversión y recordatorios intactos.
- Versión técnica 0.5.15, mismo paquete Android y firma de actualización.

## Calidad
- Ampliadas pruebas de interpretación, días al cruzar medianoche y validación de desfases.
- Quality, Android release y prueba física se verifican por separado antes de cerrar gates.

Spec: WF-BRAIN-006.
