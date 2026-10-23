# TLC Initialization Snapshot — WF-SMART-001 (2026-10-23)

## Repository and baseline
- `LoloscarPrr/WeekFlow`, `main` SHA `583fc7264b1b10d4909cef9b3e9d9abda3ad7729`, branch `feat/wf-smart-001-import-transaction`.
- Technical version 0.5.18, package com.weekflow.app, source Android versionCode 110. Quality #39665327256 PASS; Android build #39665327228 PASS. QA física NOT RUN.
- Blueprint Maestro v4.0, §15 Smart Import multimodal, confirmación única, 7 días, ambigüedad, mismo WeekSchedule, undo y reorganización; fase activa 0.8.x.

## Current import flow inspected
- `app/import.tsx`: ScheduleImportCard + SchedulePdfImportCard.
- `src/components/ScheduleImportCard.tsx`: ML Kit OCR de imagen/cámara + Excel, revisión siete días, guarda WeekSchedule directamente.
- `src/components/SchedulePdfImportCard.tsx`: PDF texto, revisión y otra escritura directa de WeekSchedule.
- `src/import/scheduleOcr.ts`, `scheduleExcel.ts`, `schedulePdf.ts`: parsers preexistentes con pruebas y algunas incertidumbres.
- `src/domain/entities/Shift.ts`: fuente canónica WeekSchedule.
- `src/state/persistence.ts`: loadWeekState/saveWeekState.
- `src/services/notifications.ts`: syncLivePlanReminders.
- `AGENTS.md` y skill TLC revisados.

## Constraints/decision
- NOW WF-SMART-001: centralizar confirmación/protección/deshacer; luego visión multimodal real.
- OCR local NO es motor visual multimodal; no prometerlo ni insertar API no conectada.
- Preservar semanas manuales, compromisos, firma, Move/Rest/Food y datos existentes.
- Usuario pidió trabajo por bloques, sin QA Android manual en cada microversión.
