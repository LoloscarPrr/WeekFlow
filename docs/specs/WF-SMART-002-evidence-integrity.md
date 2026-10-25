# WF-SMART-002 — Evidencia y seguridad en lectura de horarios

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-25
Blueprint: WeekFlow Blueprint Maestro v4.0 §15, fase 0.8.x

## Problem
WeekFlow 0.5.19 tiene una transacción única de importación segura, pero la extracción de evidencia no siempre es fiable: OCR puede convertir una colación no leída en cero, y el parser PDF puede concatenar horas de la siguiente persona o aceptar filas similares sin detectar ambigüedad. Una captura de Aramco también puede contener días «LIBRE» como texto en vez de tres horas. El usuario necesita confiar en que una lectura incierta no se aplica como cierta.

## Desired behavior
La lectura de imágenes y PDFs produce evidencia por día, sin suponer minutos ni turnos ausentes: detectar «LIBRE» explícito solo en su propia celda, exigir revisión cuando falta colación, bloquear mezcla de filas de otras personas y reportar coincidencias de nombre ambiguas. Reutilizar la revisión de 7 días y el contrato Brain de 0.8.1.

## Roadmap fit
Phase decision: NOW.
Reason: 0.8.x Smart Import requiere reconocer nombre, estructura, horas, colación, días libres y ambigüedad con la mínima intervención. Esto endurece la capa de evidencia antes de integrar modelo multimodal.

## Scope
- OCR de 7 columnas: interpretar «LIBRE», «DESCANSO», «OFF» explícitos solo si no hay horario conflictivo en el mismo día; permitir horarios con medianoche legítimos.
- OCR: dos horas de una jornada sin colación deben conservar `breakMinutes:null` y `issue` hasta intervención; no convertir automáticamente a colación de 0 minutos.
- PDF digital: bloquear la combinación de horas de nombres distintos; detectar nombres parecidos o filas repetidas como ambigüedad; validar colación ausente y marcador de libre.
- Actualizar solamente el parser OCR/PDF y pruebas deterministas que reproducen horarios comprimidos, totales semanales, texto Libre, filas múltiples y ausencia de colación.
- Mantener el review UI existente y el único commit/undo del Brain sin nueva pantalla o persistencia.
- Versión técnica 0.5.20, mismo paquete/firma, versionCode 112. CI Quality y build firmado; pruebas físicas diferidas por lotes.

## Non-goals
- Sin backend multimodal todavía, ni APIs de visión de terceros, ni secret API keys.
- No inventar colación 0 si falta, inferir libre por un solo 0:00 ni mezclar datos de otros trabajadores.
- No cambiar Excel, DayState, Move, Food, Rest, horarios de otros módulos ni SQLite.

## Acceptance criteria
1. OCR de celda explícita «LIBRE» queda `off:true`; horas en la misma columna lo hacen ambiguo y bloquean confirmación.
2. OCR de jornada con 2 horas y sin colación queda con `issue` + `breakMinutes:null` y debe corregirse en revisión antes de guardar. `00:00` sin certeza no se interpreta automáticamente como jornada.
3. OCR conserva jornadas 22:00–06:00, y un horario válido de inicio 00:30 no se rechaza solo porque la hora parezca una duración de colación.
4. PDF no lee las horas de otra persona al completar la fila de usuario; si quedan insuficientes datos, devuelve revisión obligatoria.
5. PDF rechaza nombre ambiguo (dos personas coincidentes) y nunca escoge una silenciosamente.
6. PDF con 2 horarios/día pero sin colación mantiene duda explícita; no aplica sin corrección humana.
7. Lecturas completas de siete días con colaciones verdaderas 00:00 o 00:30 conservan valores; totales semanales siguen excluidos.
8. La propuesta y los commits anteriores `prepareSmartImport/confirmReviewedImport/undoReviewedImport` permanecen intactos; Quality/Android firman sin migraciones. QA física: por lotes.

## Data / UX impact
No changes to WeekSchedule schema; `ReviewShift.issue` and `breakMinutes:null` already represent uncertainty. Same 7-day review; no new panels.

## Edge cases
- OCR text-only LIBRE vs LIBRE + 09:00–17:00; missing middle cell; midnight start; other name with more times, name matching duplicates; scanned PDFs continue to route user to image OCR; digital PDF may have times wrapped across multiple lines.
- A partial or cropped screenshot must fail closed, not synthesize hours or import another worker's row.

## Verification
CI and APK pending. No physical device QA in this microversion.
