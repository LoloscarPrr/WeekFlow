# WeekFlow Alpha 0.5.40 — Descanso protegido con horarios semanales reales

## Consolidación de Notificaciones / Rest / Semana
- Silencio Inteligente consulta el horario canónico de cada fecha, incluyendo domingo anterior, semana actual y próxima semana preparada.
- Los turnos de la semana actual dejan de repetirse automáticamente como si fueran turnos de una semana futura no preparada.
- La pantalla de Notificaciones usa la misma fuente de datos que el motor para mostrar la próxima ventana de descanso protegido.
- Las excepciones de prioridad («Salida al trabajo», «Rest» y «Momentos importantes») mantienen su comportamiento.

## Calidad y compatibilidad
- Casos de regresión de recuperación después del domingo nocturno, rosters independientes, futuro sin preparar y orden de las ventanas.
- No hay migraciones SQLite, cambios a los horarios guardados, preferencias, permisos, firma, paquete Android o canal de notificaciones.
- Versión Alpha 0.5.40; Android usa versionCode monotónico generado por el workflow y firma permanente.
- Quality y compilación Android firmada deben aprobar antes de distribuir la nueva APK.
- Prueba física de entrega 24h/48h bajo reposo, alarmas exactas y cambios entre semanas permanece pendiente en Redmi; ningún build prueba por sí solo la puntualidad de Android.

Spec: WF-NOTIFY-010
