# WeekFlow Alpha 0.2.4

- Corrige la lectura OCR de planillas reales cuando ML Kit comprime varias celdas horarias en un elemento ancho.
- Si la geometría por columna falla pero la fila contiene los 21 valores esperados, reconstruye los 7 días de izquierda a derecha.
- Mantiene fuera el total semanal y conserva la revisión manual cuando faltan datos o la fila sigue siendo ambigua.
- Añade un caso de regresión basado en la planilla real de prueba: lunes/sábado/domingo libres, martes 07:00–17:30 y miércoles a viernes 20:45–07:30 con 30 min de colación.
