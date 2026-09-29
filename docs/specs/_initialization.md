# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `080e5f2b072421ef6d8e79c0d492d92a14634b79`.
- Working branch: `codex/wf-week-005-ocr-row-dedup`.
- Blueprint Maestro v3.4 remains the current product source of truth.

## App / build
- WeekFlow `0.4.5` / source `versionCode 87`; Android package `com.weekflow.app`.
- Main Quality #204: PASS.
- Android #154 for 0.4.5 is still running at the signed APK build step at the moment this snapshot is refreshed; no failure has been reported.
- Physical Android evidence from Oscar shows a reproducible OCR false ambiguity when the same `OSCAR` row is returned both as an atomic name cell and as a wider OCR line containing the row hours.

## Product context / active scope
- Current focus remains Semana + importación.
- Camera/gallery OCR is the primary real-world import path; Excel/PDF remain existing secondary paths and are outside this fix.
- Import must never silently choose between genuinely ambiguous people, but it also must not treat two OCR representations of the same physical row as two people.
- Existing review-before-save behavior remains mandatory.

## Relevant specs and modules
- `WF-WEEK-001` — compact canonical Week screen: DONE.
- `WF-WEEK-002` — minimal important event: DONE.
- `WF-WEEK-003` / `WF-QA-004` — keyboard visibility: physically accepted.
- `WF-WEEK-004` — compact Ritual completion: merged in 0.4.5; physical acceptance still pending.
- Active parsing module: `src/import/scheduleOcr.ts`.
- Regression suite: `tests/ocr-confidence.test.ts`.

## Baseline
- PASS — Quality #204 on `main`.
- PASS — current OCR regressions for exact name, weak partial match, distinct compatible names, night shifts and compressed rows.
- FAIL — physical capture: one actual `OSCAR` row is reported as two compatible candidates because both atomic and line-level OCR text are searched together.
- NOT RUN locally — this execution environment has no direct repository network checkout; GitHub Quality is the executable verification gate.

## Next action / constraints
- Active spec: `WF-WEEK-005 — OCR: distinguir nombre real de eco de fila`.
- Prefer atomic OCR elements for name identity and use whole lines only as fallback.
- Preserve ambiguity blocking for two physically distinct rows, including identical names.
- Do not alter shift parsing, confidence thresholds, Excel/PDF, SQLite, Ritual, signing or other modules.
- Publish the fix as 0.4.6 / source versionCode 88, run Quality, then generate signed APK/AAB and retest the exact physical capture.