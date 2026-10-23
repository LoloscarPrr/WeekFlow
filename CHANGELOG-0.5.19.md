# WeekFlow Alpha v0.5.19 — Smart Import 0.8.1 foundation

## Smart Import
- Imagen, foto, Excel y PDF ahora envían las siete jornadas al mismo servicio Brain antes de guardar.
- Valida días, turnos nocturnos, días libres, colación y lectura incierta sin inventar datos.
- Una confirmación aplica la semana completa; si se modificó desde la lectura, se bloquea para no sobrescribirla.
- Se mantienen momentos importantes y se marca la semana para organizar nuevamente.
- Muestra «Deshacer importación» y evita borrar correcciones hechas después.
- Resincroniza recordatorios al aplicar y revertir.
- Conserva Semana manual y el importador existente.
- Esta es la base transaccional. La lectura de capturas **aún usa OCR local**, no un modelo de visión multimodal. Esa conexión es un paso posterior de Smart Import 0.8.x.

## Quality
- Nuevas regresiones de validación/undo/conflicto y checks de ambos importadores.
- APK/AAB firmado 0.5.19 se publica solo tras CI.
- Sin nuevas tablas SQLite, sin cambios de paquete ni firma.
Spec: WF-SMART-001.
