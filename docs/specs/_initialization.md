# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `origin/main`
- Working ref/branch: `codex/wf-week-002-minimal-important-event`
- Latest relevant commit: `f935dd3932575cebfe685cea11c9cb513eda4c97` — verified WeekFlow 0.3.17 Google Play candidate.

## App / build state
- Source version: `0.3.17`; Android source `versionCode`: `72`.
- Published candidate: package `com.weekflow.app`, version `0.3.17`, CI `versionCode` `100122`.
- The published APK/AAB passed signature, bundle, target API 36, privacy-manifest and 16 KB alignment checks.

## Product context
- Current Blueprint Maestro: v3.2; `SCH-15` keeps important moments in the canonical WeekFlow model and the Free scope includes important moments with a concrete date.
- Current product focus: preserve the compact Week screen while restoring the smallest useful manual path for an important event.
- The user's current instruction explicitly supersedes the earlier 0.2.5 decision that hid manual important-moment controls pending an Assistant flow.

## Specs
- `WF-WEEK-001 — Semana canónica y compacta`: DONE; removed the verbose ritual while preserving important-moment data.
- `WF-COMM-003 — Google Play privacy and release candidate`: DONE; 0.3.17 signed candidate verified.
- Proposed next spec: `WF-WEEK-002 — Registro mínimo de evento importante`.

## Relevant implementation surface
- Week UI: `app/week.tsx` and a new focused event component under `src/components/`.
- Week state controller: `src/presentation/week/useWeekController.ts`.
- Existing behavior/persistence: `upsertImportantMoment`, `removeImportantMoment`, `loadWeekState` and `saveWeekState`.
- Downstream consumers: Ahora and local notifications already read `importantMoments`.

## Baseline
- Local TypeScript + tests: `PASS` — `npm run quality` on current `origin/main`; 19 core regressions plus OCR, Excel, Move, commercial and consent suites passed.
- Current 0.3.17 release validation: `PASS`, recorded in `WF-COMM-003`.
- Play Console state for the older build uploaded from another chat: `UNAVAILABLE`; no Play Console write capability is available in this session.

## Constraints / uncertainties
- The supplied video shows the verbose pre-0.3.15 Week ritual; it is reference evidence, not the code base for this change.
- The new control must not restore ritual, origin, human summary, second confirmation or explanatory paragraphs.
- A signed 0.3.18 APK/AAB requires the repository release workflow after merge.

## Next TLC action
- Lock `WF-WEEK-002`, implement only the compact event flow, verify persistence and sibling consumers, then prepare the 0.3.18 release.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature spec still defines what must be built.
