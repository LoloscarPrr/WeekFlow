# OCR confidence cases · Alpha 0.2.3

Casos que debe cubrir la compuerta de calidad del parser de horario:

- coincidencia exacta del nombre configurado;
- ausencia total del nombre;
- coincidencia parcial débil que no debe seleccionar una fila;
- dos filas distintas compatibles con el mismo nombre que deben quedar ambiguas;
- columna/día reconstruido sin encabezado explícito que debe quedar en confianza media y requerir revisión;
- jornada nocturna y días 00:00/00:00 siguen siendo revisables sin inventar horas.

Este archivo documenta el criterio de regresión de SCH-07, SCH-08 y SCH-09 para la Alpha 0.2.3.
