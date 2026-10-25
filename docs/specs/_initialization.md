# TLC Initialization Snapshot — WF-SMART-004 (2026-10-25)

## Repository/ref, versión y baseline
- `LoloscarPrr/WeekFlow`, main `759130212292f3f63772151359216ff68dfc7341`; branch `feat/wf-smart-004-focused-review`.
- Technical WeekFlow 0.5.21, Android source versionCode 113, package `com.weekflow.app`, firma de release existente.
- Quality main #40208293049 PASS, Android signed #40208293053 PASS y release `weekflow-v0.5.21` publicada. QA física NOT RUN (pedido del usuario: pruebas agrupadas).
- Blueprint Maestro v4.0 §15: Smart Import con identidad/siete días/revisión mínima/confirmación/deshacer.

## Contexto de fuentes y trabajo activo
- Specs WF-SMART-001 commit/undo canónico, WF-SMART-002 OCR/PDF sin valores inventados, WF-SMART-003 gateway IA visual opcional con backend NO LIVE, SUPABASE WeekFlow INACTIVE, claves y cuotas no verificadas.
- `src/components/ScheduleImportCard.tsx`, `SchedulePdfImportCard.tsx` hoy renderizan 7 editores expandidos.
- `src/brain/smartImport.ts` tiene validador autoritativo y chequeo de estado anterior/commit/undo.
- `src/import/scheduleOcr.ts` define `ReviewShift`; `src/domain/entities/Shift.ts` `WeekSchedule`. Tests de estructura exigen un commit Brain, no escrituras UI.
- Expo 57, React Native 0.86, usuario usa Android sin PC y no quiere pruebas en cada microversión.

## Decisión
- NOW WF-SMART-004: revisión compacta y comparativa, centrar correcciones, mismo Brain.
- BACKLOG: despliegue/financiación de IA en servidor; no restaurar Supabase sin política de costo ni consentimiento.
- No migrar datos, no cambiar firma ni fuentes canónicas, preservar semana guardada.
