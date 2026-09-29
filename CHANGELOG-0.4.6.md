# WeekFlow Alpha 0.4.6

- Corrige una falsa ambigüedad al importar horarios por foto/captura cuando OCR devuelve el nombre de la persona y, además, una línea completa de la misma fila que vuelve a comenzar con ese nombre.
- WeekFlow prioriza la celda OCR atómica del nombre y usa líneas completas solo como respaldo.
- Dos filas realmente distintas con el mismo nombre siguen bloqueando la selección automática.
- Conserva las validaciones existentes para coincidencias débiles, jornadas nocturnas, días libres, colación y filas comprimidas.
- No cambia datos, SQLite, Excel, PDF, Ritual, firma ni reglas de actualización.

Android source versionCode: `88`

Spec: WF-WEEK-005