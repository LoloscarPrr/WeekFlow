# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `main`
- Working ref/branch: `fix/wf-week-001-edit-important-moments`
- Latest relevant commit: `b8c45020c8b6d469dee0c2bf4da15b730c2fed68` — WF-COMM-002 Google Play AAB public preview foundation

## App / build state
- App version: `0.3.14`
- Android versionCode/build metadata in source: `69` (the release workflow assigns a monotonic CI value)
- Package/application id: `com.weekflow.app`

## Product context
- Current Blueprint Maestro: `WeekFlow_Blueprint_Maestro_v3.2.docx`
- Current roadmap/product focus: preserve Core stability and persistence before widening scope, while the commercial Google Play track proceeds in parallel.
- Relevant product decisions: D-001 WeekFlow adapts to the user; D-011 Core/import stability first; D-013 Semana is the canonical schedule editor; D-017 one app and one codebase for Free/Premium.
- Relevant catalog intent: important moments with concrete dates are part of the Free core and manual corrections must preserve the same persisted truth across Semana and Ahora.

## Specs
- Active/relevant completed specs:
  - `WF-CORE-003 — Adaptive multiple-layout shell — DONE`
  - `WF-CORE-005 — Firebase Crashlytics — DONE`
  - `WF-NOTIFY-001 — Deduplicate local reminders — DONE`
  - `WF-COMM-001 — Free/Premium entitlement foundation — DONE`
  - `WF-COMM-002 — Google Play AAB public preview foundation — DONE`
- Proposed spec:
  - `WF-WEEK-001 — Edit important moments without deleting them`

## Relevant implementation surface
- UI: `src/components/WeekRitualCard.tsx`
- Domain update path: `src/application/useCases/updateWeekSchedule.ts`
- Presentation/persistence path: `src/presentation/week/useWeekController.ts` and SQLite-backed `saveWeekState`
- Regression coverage: `tests/regression.test.ts`
- Persistence/migration surface: no schema or migration change expected; edits reuse the existing moment ID.
- Shared behavior to protect: new moment creation, deletion, ritual completion, summary count, Ahora lookup and reminder scheduling.

## Baseline
- Type/static checks: `PASS` on main Quality run #114 for `b8c4502`.
- Tests: `PASS` as part of main Quality run #114.
- Build/CI: `PASS` on Build WeekFlow Native Android run #119.
- Device evidence: `FAIL` for correction UX in the supplied Android recording; saved moments expose only destructive deletion and cannot be corrected in place.
- Known pre-existing failures: none observed in the latest main CI.

## Constraints / uncertainties
- Preserve existing stored moments and the single package/update line.
- Do not add a database migration or change the `ImportantMoment` schema.
- Keep create and delete behavior intact outside the edit flow.
- Automated domain verification is available; post-fix physical interaction remains pending until the generated APK is exercised on device.

## Next TLC action
- Proposed spec: `WF-WEEK-001 — Edit important moments without deleting them`
- Reason: let users correct a saved moment's name, date or time while preserving its identity, persistence and downstream visibility.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
