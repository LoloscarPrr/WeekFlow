# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `main`
- Working ref/branch: `codex/wf-week-001-compact-week`
- Latest relevant commit: `b8c45020c8b6d469dee0c2bf4da15b730c2fed68` — WF-COMM-002 / Google Play AAB public preview foundation

## App / build state
- App version: `0.3.14`
- Android versionCode/build metadata in source: `69` (release workflow replaces it with a monotonic CI value)
- Package/application id: `com.weekflow.app`

## Product context
- Current Blueprint Maestro: `WeekFlow_Blueprint_Maestro_v3.2.docx`, supplied for this session.
- Current product focus for this change: make Semana the concise, canonical editor for the real work schedule.
- Relevant decisions: D-001 reduce user burden; D-013 Semana is the only canonical shift editor; `weekflow-0.2.5-scope.md` hides manual ImportantMoment controls; screenshot/camera remains the primary import path with review.
- Commercial Google Play work remains parallel and is not changed here.

## Specs
- Active/relevant specs:
  - `WF-CORE-001 — Adopt spec-driven development — DONE`
  - `WF-CORE-002 — TLC initialization — DONE`
  - `WF-CORE-003 — Adaptive multiple-layout shell — DONE`
  - `WF-CORE-005 — Firebase Crashlytics — DONE`
  - `WF-COMM-001 — Free/Premium entitlement foundation — DONE`
  - `WF-COMM-002 — Google Play AAB public preview foundation — DONE`
- No prior `WF-WEEK-*` spec exists.
- Proposed spec: `WF-WEEK-001 — Semana canónica y compacta`.

## Relevant implementation surface
- Primary screen: `app/week.tsx`.
- Presentation state: `src/presentation/week/useWeekController.ts`.
- Obsolete manual ritual UI: `src/components/WeekRitualCard.tsx`.
- Import completion copy: `src/components/ScheduleImportCard.tsx` and `src/components/SchedulePdfImportCard.tsx`.
- Version/release notes: `app.json`, `package.json`, `CHANGELOG-0.3.15.md`.
- Persistence/migration surface: no schema change; stored shifts, `importantMoments` and `organizedAt` must remain compatible.

## Baseline
- Type/static checks: `PASS` on main Quality run #114 for `b8c4502`.
- Tests: `PASS` as part of main Quality run #114 for `b8c4502`.
- Build/CI: `PASS` on Build WeekFlow Native Android run #119 for `b8c4502`.
- Local baseline: `NOT RUN` before the locked spec.
- Known pre-existing failures: `NONE OBSERVED` on latest main CI.

## Constraints / uncertainties
- The current Week screen contradicts the 0.2.5 product decision by still rendering `WeekRitualCard` and manual ImportantMoment controls.
- Existing ImportantMoment data is consumed by Ahora and notifications; the model and stored data must not be deleted.
- Manual day editing, native time pickers, break editing and import navigation must remain interactive.
- No device simulator is available in this session; runtime visual confirmation on a physical phone follows the merged Android artifact.

## Next TLC action
- Spec: `WF-WEEK-001 — Semana canónica y compacta`.
- Reason: remove redundant/inactive content while preserving the four useful Week actions: scan the summary, inspect a day, edit a day and import a schedule.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
