# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: remote `main` at `15a4dfdebc14d198300846c2e6442d08d79a98a5`.
- Working ref/branch: `codex/wf-week-003-keyboard-visibility`.
- Latest relevant commit: `15a4dfdebc14d198300846c2e6442d08d79a98a5` — closed verification for the published WeekFlow 0.3.18 event flow.

## App / build state
- Source version: `0.3.18`; Android source `versionCode`: `73`.
- Published candidate: package `com.weekflow.app`, version `0.3.18`, CI `versionCode` `100123`.
- Google Play accepted the 0.3.18 AAB and the user confirmed the app works; the reported regression is limited to keyboard visibility in Semana.

## Product context
- Current Blueprint Maestro: v3.2; `SCH-15` keeps important moments in the canonical WeekFlow model and the Free scope includes important moments with a concrete date.
- Current product focus: preserve the compact Week screen and make its minimal important-event form usable above the software keyboard.
- Blueprint v3.2 requires screens to respect keyboard, safe area and bottom navigation on small phones.

## Specs
- `WF-WEEK-001 — Semana canónica y compacta`: DONE.
- `WF-WEEK-002 — Registro mínimo de evento importante`: DONE; 0.3.18 published and accepted by Google Play.
- Proposed next spec: `WF-WEEK-003 — Evento importante visible sobre el teclado`.

## Relevant implementation surface
- Week UI: `app/week.tsx` and `src/components/ImportantEventCard.tsx`.
- Shared keyboard patterns to compare: `app/food.tsx`, `src/move/MoveHome.tsx` and `src/components/TimeEditModal.tsx`.
- App configuration already uses Android `softwareKeyboardLayoutMode: resize`; the missing behavior is screen-level avoidance and focus scrolling.
- Persistence and downstream consumers are outside scope.

## Baseline
- Local TypeScript + tests: `PASS` — TypeScript and all six test commands pass; 20 core regressions plus OCR, Excel, Move, commercial and consent suites.
- Current 0.3.18 release validation and Google Play ingestion: `PASS`.
- Physical keyboard interaction after the fix: `UNAVAILABLE` until the signed APK is installed by the user.

## Constraints / uncertainties
- The local git object store is behind remote `main`, but the 0.3.18 product code matches the merged implementation; publication must target current remote `main` through GitHub.
- The fix must not change the compact event form, schedule editing, persistence, native pickers or navigation behavior.
- A physical-device confirmation remains necessary because automated tests cannot prove OEM keyboard positioning.

## Next TLC action
- Lock `WF-WEEK-003`, add keyboard avoidance and focus scrolling only, run regression checks, then prepare 0.3.19.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature spec still defines what must be built.
