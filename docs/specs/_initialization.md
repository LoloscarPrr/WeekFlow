# TLC Initialization Snapshot — 2026-10-25 / WF-SMART-002

## Repo and baseline
- `LoloscarPrr/WeekFlow` main `b7133044367ac5b94a9a64f7bcba49d0a2a00d55`, working branch `feat/wf-smart-002-schedule-evidence`.
- Technical 0.5.19, com.weekflow.app, Android source versionCode 111, same signing.
- Quality #39950902977 PASS; Android signed #39950902966 PASS with APK/AAB release weekflow-v0.5.19. Physical QA NOT RUN (user prefers batched tests).
- Blueprint Maestro v4.0 §15 current focus: Smart Import 0.8.x; multimodal final objective, not yet integrated.

## Existing active specs
- WF-SMART-001 canonical 7-day transaction is merged, Verified CI, Android PASS, physical QA pending.
- WF-SMART-002 (NOW) evidence integrity of OCR/PDF before future vision model.

## Modules inspected
- `src/import/scheduleOcr.ts`, `schedulePdf.ts`, `scheduleExcel.ts`; tests `ocr-confidence.test.ts`, `excel-import.test.ts`.
- `src/components/ScheduleImportCard.tsx`, `SchedulePdfImportCard.tsx`, `src/brain/smartImport.ts`, persistence adapter.
- `AGENTS.md` and `.agents/skills/tlc-spec-driven/SKILL.md` observed.

## Risks / constraints
- OCR currently treats missing colación as 0, plus unguarded PDF continuation across other person's hours; must fail closed.
- Explicit FREE / LIBRE text should be read locally without assuming another cell.
- No network vision inference provider/key currently established; do not claim IA multimodal, keep local ML Kit until legitimate integration.
- Version 0.5.20 prepared as batched CI build; avoid user manual QA per microversion.
