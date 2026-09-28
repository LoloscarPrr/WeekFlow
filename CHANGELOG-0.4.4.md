# WeekFlow Alpha 0.4.4

- Corrige el caso restante en que el teclado puede superponerse al área visible y dejar sin espacio suficiente para subir el formulario.
- Añade un espacio inferior temporal equivalente solo a la superposición real del teclado, más el margen de visibilidad del campo activo.
- Si Android `adjustResize` ya reduce correctamente el viewport, el espacio adicional es 0 y no cambia el layout normal.
- Mantiene accesibles el campo de Food y sus acciones Registrar/Cancelar, además del comportamiento compartido de Semana, Move y Corregir hora.
- No cambia datos, esquema, lógica de negocio ni firma; añade regresiones para superposición, cierre/reapertura y falta de rango de scroll.
