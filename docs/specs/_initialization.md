# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `main`
- Working ref/branch: `main`
- Latest relevant commit: `d349d42ac30343741e34b5ba5dc2e2615542815b` — WF-WEEK-001 / Semana canónica y compacta

## App / build state
- App version: `0.3.15`
- Android versionCode/build metadata in source: `70` (release workflow used monotonic CI metadata for the published binary)
- Package/application id: `com.weekflow.app`
- Published release: `weekflow-v0.3.15` with standalone APK and Play AAB.

## Product context
- Current Blueprint Maestro: `WeekFlow_Blueprint_Maestro_v3.2.docx`.
- Latest product result: Semana is the concise canonical editor for the real work schedule.
- Relevant decisions preserved: D-001 reduce user burden; D-013 Semana is the only canonical shift editor; manual ImportantMoment controls remain hidden for the future Assistant; screenshot/camera remains the primary reviewed import path.
- The commercial Google Play track remains parallel and unchanged.

## Specs
- Active/relevant specs:
  - `WF-CORE-001 — Adopt spec-driven development — DONE`
  - `WF-CORE-002 — TLC initialization — DONE`
  - `WF-CORE-003 — Adaptive multiple-layout shell — DONE`
  - `WF-CORE-005 — Firebase Crashlytics — DONE`
  - `WF-COMM-001 — Free/Premium entitlement foundation — DONE`
  - `WF-COMM-002 — Google Play AAB public preview foundation — DONE`
  - `WF-WEEK-001 — Semana canónica y compacta — DONE`

## Relevant implementation surface
- Semana: `app/week.tsx`.
- Week presentation state: `src/presentation/week/useWeekController.ts`.
- Import completion copy: `src/components/ScheduleImportCard.tsx` and `src/components/SchedulePdfImportCard.tsx`.
- Version/release notes: `app.json`, `package.json`, `CHANGELOG-0.3.15.md`.
- Persistence/migration surface: unchanged; shifts, `importantMoments` and `organizedAt` remain compatible.

## Baseline
- Local TypeScript + tests: `PASS` — 19 regressions plus OCR, Excel, Move and commercial suites.
- Pull request Quality: `PASS` — run #117 on PR #76.
- Main Type/static checks and tests: `PASS` — Quality run #118 for `d349d42`.
- Build/CI: `PASS` — Build WeekFlow Native Android run #120 for `d349d42`.
- Release outputs: `PASS` — signed standalone APK and Play AAB published for `0.3.15`.
- Known pre-existing failures: `NONE OBSERVED` on the completed release pipeline.

## Constraints / uncertainties
- Physical-device visual confirmation of the new Week layout is `UNAVAILABLE` in this session and should be checked when the 0.3.15 APK is installed.
- Existing ImportantMoment data remains active for Ahora and notifications even though manual Week controls are hidden.
- Future Week changes must preserve day editing, native time pickers, break editing and reviewed import.

## Next TLC action
- Reinitialize against the latest `main` before the next approved product change and create/resume its spec.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
