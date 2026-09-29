# WF-WEEK-005 — OCR: distinguir nombre real de eco de fila

Status: VERIFYING
Owner: WeekFlow

## Problem
En una captura real de horario, ML Kit puede devolver al mismo tiempo la celda atómica del nombre (`OSCAR`) y una línea OCR más amplia que contiene ese mismo nombre junto con horas de la fila (`OSCAR 13:00 0:30 22:00...`). La selección actual mezcla líneas y elementos atómicos como candidatos equivalentes, por lo que puede interpretar ambas representaciones de la misma fila como dos personas distintas y bloquear la importación con una ambigüedad falsa.

## Desired behavior
WeekFlow debe preferir elementos OCR atómicos para identificar la fila de la persona y usar las líneas completas solo como respaldo cuando los elementos atómicos no entregan una coincidencia suficientemente segura. Una línea amplia de la misma fila no debe convertirse en un segundo candidato. Si realmente existen dos filas distintas compatibles con el nombre —incluyendo dos filas idénticas `OSCAR`— la importación debe seguir bloqueándose y exigir revisión.

## Scope
- Priorizar candidatos de nombre provenientes de elementos OCR atómicos.
- Usar líneas OCR completas como fallback únicamente si los elementos atómicos no ofrecen una coincidencia de confianza suficiente.
- Considerar candidatos fuertes en filas verticalmente distintas como ambigüedad real aunque el texto normalizado sea idéntico.
- Añadir regresiones para el caso observado en dispositivo y para dos filas exactas con el mismo nombre.
- Publicar como WeekFlow 0.4.6 / source versionCode 88.

## Non-goals
- No cambiar lectura de horas, colación, jornadas nocturnas, 00:00, geometría de columnas ni reconstrucción secuencial.
- No reducir los umbrales de seguridad de coincidencia de nombre.
- No seleccionar automáticamente entre dos personas reales compatibles.
- No cambiar Excel, PDF, SQLite, navegación, Ritual, momentos importantes ni firma Android.

## Acceptance criteria
- [x] AC1 — Si ML Kit devuelve `OSCAR` como elemento atómico y una línea de la misma fila que comienza con `OSCAR` y contiene horas, WeekFlow no muestra una falsa ambigüedad.
- [x] AC2 — En ese caso, `matchedNameText` conserva la celda atómica `OSCAR` como candidato elegido.
- [x] AC3 — Dos filas físicamente distintas llamadas exactamente `OSCAR` siguen bloqueando la selección automática.
- [x] AC4 — Coincidencias parciales débiles y dos nombres distintos compatibles siguen bloqueándose como antes.
- [x] AC5 — La lectura existente de jornadas nocturnas, días libres y filas comprimidas conserva sus regresiones actuales.
- [ ] AC6 — `npm run quality` pasa en PR y en main.
- [ ] AC7 — Android firmado 0.4.6 genera APK/AAB actualizables sobre la instalación existente.
- [ ] AC8 — Prueba física con la captura real llega a la revisión de los siete días en vez de mostrar `No te encontré` por una ambigüedad falsa.

## Data / persistence impact
Ninguno. El cambio ocurre antes de guardar y solo decide qué representación OCR corresponde al nombre. No hay migración ni cambio de esquema.

## UI / UX impact
No se añade UI nueva. El cambio elimina el mensaje de ambigüedad falso para capturas donde el OCR repite el nombre dentro de la línea completa de horarios. Las ambigüedades reales siguen mostrando el mismo bloqueo existente.

## Edge cases / regressions
- Nombre exacto en celda atómica + línea amplia de la misma fila.
- Dos filas exactas `OSCAR` en distintas coordenadas verticales.
- `OSCAR URRUTIA` vs `OSCAR URRUTIA PEREZ`.
- Coincidencia parcial débil.
- OCR sin elementos atómicos: debe continuar funcionando mediante fallback de líneas.
- Fila comprimida con 21 valores y total semanal adicional.

## Verification plan
- Ejecutar la suite `ocr-confidence.test.ts` dentro de `npm run quality`.
- Confirmar que el resto de la suite completa no cambia de comportamiento.
- Revisar diff para verificar ausencia de cambios fuera de identificación de nombre, tests, documentación y versión.
- Fusionar solo con Quality verde.
- Generar APK/AAB firmado y repetir la importación con la captura física aportada por el usuario.

## Evidence
La evidencia física muestra una sola fila `OSCAR` en la planilla, mientras WeekFlow reporta dos candidatos: `OSCAR` y una cadena `OSCAR ...horas...`. Esto confirma que el segundo candidato es un eco OCR de la misma fila, no otra persona.