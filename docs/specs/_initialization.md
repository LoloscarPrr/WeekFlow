# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `12add23161179cfb3bcc9bf47b2d3448967af136`.
- Working branch: `council/wf-council-2026-10-06`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.4`; source Android `versionCode 96`; package `com.weekflow.app`.
- Latest main commit is a non-code asset commit and has no workflow run associated through the available connector.
- Local `npm run quality`: UNAVAILABLE in this session because the execution container has no network access to install repository dependencies.

## Product context / active scope
- Blueprint v4.0 defines Ahora as a single-priority surface and Move as adaptive to real time, energy, objective, feedback and equipment.
- `WF-MOVE-007` marks the canonical Move 0.2.x exit gate as DONE; this session is a small post-gate refinement, not a reopening of Move architecture.
- Existing Food, Rest, Habits, Jardín and Brain work is out of scope for this implementation batch.
- Smart Import remains frozen/out of scope.

## Relevant repository state
- Move already supports profile, goals, experience, equipment/cargas, intensity adaptation, progression, guided sessions and feedback.
- Ahora already computes a live priority card, but current visual order places summary/energy controls before that priority.
- TLC exists, but the spec template does not yet require an explicit roadmap-phase admission decision.

## Baseline
- PASS — repository metadata, branch and current version inspected.
- PASS — relevant Move/Now source and regression tests inspected.
- NOT RUN — current branch Quality/Android workflows (no changes committed yet).
- UNAVAILABLE — local dependency-backed typecheck/tests.

## Next action / constraints
- `WF-CORE-007 — Gate de fase obligatorio en specs`.
- `WF-NOW-001 — Prioridad viva primero en Ahora`.
- `WF-MOVE-008 — Versión más corta de la sesión`.
- Preserve persistence schemas and existing state semantics.
- Do not add Food, Rest, Brain, Insights or Smart Import behavior in this batch.
- Target technical release: `0.5.5` / source Android `versionCode 97` if verification passes.
