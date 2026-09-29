# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `65dede6e9359e114d35bbb797efdd905475237d0`.
- Working branch: `codex/wf-week-004-ritual-completion`.
- Blueprint Maestro v3.4 remains the current product source of truth.

## App / build
- WeekFlow `0.4.4` / source `versionCode 86`; Android package `com.weekflow.app`.
- Main Quality #202: PASS.
- Main Android #153: PASS; signed Standalone APK and Play AAB generated with permanent signing.
- Physical Android acceptance for the 0.4.4 keyboard correction: PASS from Oscar's device test; focused fields and actions remain usable with the keyboard open.

## Product context / active scope
- P0 keyboard/accessibility work is closed enough to move to the next committed product slice: Semana + importación.
- Blueprint v3.4 requires the 0.2.x flow to end with a human summary and a clear Ritual de la Semana closure after the schedule has been reviewed.
- `screenshot-first-schedule-import.md` keeps camera/gallery OCR as the real primary path and treats Excel as secondary. The current Blueprint also lists Excel/PDF; this spec does not resolve that historical priority tension and does not remove existing formats.
- Existing compact Semana decisions remain binding: do not restore the old long ritual block, duplicate explanations, origin panels or verbose confirmation UI.

## Relevant specs and modules
- `WF-WEEK-001` — compact canonical Week screen: DONE; compactness must be preserved.
- `WF-WEEK-002` — minimal important event: DONE; event capture stays compact and in Semana.
- `WF-WEEK-003` / `WF-QA-004` — keyboard visibility: DONE enough for physical acceptance of 0.4.4.
- Existing import modules: `ScheduleImportCard`, `SchedulePdfImportCard`, `scheduleOcr.ts`, `scheduleExcel.ts`, `schedulePdf.ts`.
- Existing use case `completeWeekRitual(...)` persists `organizedAt` but is currently not connected to the Week UI.

## Baseline
- PASS — Quality #202 on `main`.
- PASS — Android #153 on `main`.
- PASS — physical 0.4.4 keyboard acceptance on Android.
- PASS — current import flow requires review before `Confirmar semana` and preserves existing important moments.
- NOT RUN — local checkout/tests in this execution environment; repository network access is unavailable here, so verification will rely on GitHub Quality/Android plus source-level regression checks added in this change.

## Next action / constraints
- Proposed active spec: `WF-WEEK-004 — Cierre compacto del Ritual de la Semana`.
- Connect the existing `completeWeekRitual` use case to Semana instead of inventing a second state model.
- Keep manual edits immediate; any shift/event edit continues reopening the week (`organizedAt: null`) until the user closes it again.
- Closing the week must persist a valid timestamp and refresh live reminders.
- Show only a concise human summary using the existing work-days/free-days/programmed-hours data.
- Do not change OCR parsing, Excel/PDF parsing, SQLite schema, important-moment model, Free/Premium rules, signing or other modules.
