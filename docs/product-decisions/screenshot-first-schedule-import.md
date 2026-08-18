# Semana: la captura es el caso real

Desde 2026-08-18, la ruta principal de importación de Semana es **foto/captura → OCR → revisión → confirmar**.

En el uso real, el horario llega como una captura de una planilla, no como el archivo Excel original. Por eso:

- XLSX/XLS queda como capacidad secundaria ya implementada; no guía el roadmap.
- PDF deja de ser requisito para cerrar 0.2.x y se difiere.
- OCR desde cámara/galería sigue siendo el flujo que debe recibir QA y mejoras.
- Ninguna lectura automática puede guardar la semana sin revisión.

Esta decisión permite abrir 0.3.x Move sin seguir optimizando formatos que no representan el flujo habitual.
