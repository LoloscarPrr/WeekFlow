# WeekFlow Alpha 0.5.20 — Smart Import 0.8.2

- Capturas: reconocimiento de «LIBRE», «DESCANSO» y «OFF» dentro de la celda del día.
- Un día contradictorio «LIBRE + horas» ahora queda pendiente de corrección, sin importación silenciosa.
- Colación no detectada queda explícitamente pendiente; no se asume 00:00.
- Turnos reales que comienzan a medianoche (00:30) se aceptan sin confundirlos con la duración de colación.
- PDF digital: varias coincidencias de nombre se consideran ambiguas. No concatena datos de otro trabajador cuando el horario de la fila viene incompleto. Recupera filas de horas divididas en líneas.
- La misma validación final y la transacción reversible de Smart Import 0.8.1 permanecen canónicas.
- Sin servicios remotos de IA visual: el proveedor de imágenes sigue siendo ML Kit OCR local, con una frontera explícita hacia la integración multimodal posterior.
- Sin cambio de esquema ni firma, mismo `com.weekflow.app`.

Verificación: suite de OCR/PDF, estructura, regresiones globales, Quality y APK firmada. QA manual solo tras juntar avances.
Spec: WF-SMART-002.
