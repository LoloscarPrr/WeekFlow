# WeekFlow Alpha v0.5.18

## Brain 0.7.9 — salidas explicables
- Al decir «salí una hora tarde» o «salí a las 23:30», el Asistente enseña el impacto ANTES de pedir confirmación.
- La propuesta explica diferencia respecto al turno, llegada a casa ESTIMADA, recuperación y si hay bloques flexibles pendientes de confirmación en Ahora.
- Después de confirmar, el Asistente explica el impacto calculado desde el estado canónico; no inventa compromisos ni mueve los fijos.
- Corregido el cálculo de diferencia al salir pasada medianoche incluso desde un turno que no estaba catalogado como nocturno.
- Ahora, Brain y Asistente usan fechas reales para decidir si el desplazamiento requiere revisar bloques flexibles.
- Se mantienen confirmación explícita, deshacer seguro, horarios variables, Food, Move y Rest. Sin nueva base de datos ni permiso Android.
- APK 0.5.18 como siguiente versión agrupada; QA física solo al cerrar el bloque (sin pedir instalar cada commit).

## Calidad
- Tests puros de diferencias y mensajes en horario de tarde/noche, retorno, recuperación y bloques flexibles; controles estructurales.
- Quality CI + Android release firmado antes de distribuir.
- Blueprint Maestro v4.0, §14. Spec: WF-BRAIN-009.
