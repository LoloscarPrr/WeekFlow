# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `bd9ba1339955d51380515d6183dbef7069169631`.
- Working branch: `brain/wf-brain-001-action-foundation`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.8`; source Android `versionCode 100`; package `com.weekflow.app`.
- Main Quality #258: PASS.
- Main Android #167: PASS; signed APK + AAB published for 0.5.8.
- Local dependency-backed quality: UNAVAILABLE in this session; GitHub Actions is the verification runner.

## Product context / active scope
- Current canonical phase: `0.7.x — Assistant + Brain`.
- Blueprint requires Brain as the single decision layer and Assistant as an interface, not a parallel state owner.
- Important automation must be explainable, confirmable or reversible.
- This batch implements only `0.7.1 — Brain Action Foundation`.
- Natural-language parsing, chat UI, voice, Smart Import and autonomous replanning are out of scope.

## Relevant repository state
- `src/brain/engine.ts` currently computes plans and replans but does not expose a transactional action contract.
- Ahora already applies energy and actual-exit changes through application use cases.
- Semana already applies shift/event changes through application use cases.
- Existing controllers persist their own state; 0.7.1 must not create a second canonical store.
- Existing SQLite schema remains the source of truth for DayState/WeekSchedule.

## Baseline
- PASS — Blueprint Brain/Assistant principles and 0.7 roadmap inspected.
- PASS — Brain engine, Ahora controller, Semana controller and relevant use cases inspected.
- PASS — 0.5.8 Quality/Android release verified.
- NOT RUN — branch Quality/Android (no 0.7.1 code yet).

## Next action / constraints
- `WF-BRAIN-001 — Action Foundation`.
- Proposal must be explicit, explainable and confirmation-aware.
- Application must reuse existing use cases rather than duplicate domain mutation logic.
- Undo must not silently overwrite newer state.
- No parallel Assistant state and no new persistence schema.
- Target technical release: `0.5.9` / source Android `versionCode 101` if verification passes.
