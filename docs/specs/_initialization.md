# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `cc5455a4f41e5dd29bdb866bfc41a6e5c7dc7dd0`.
- Working branch: `codex/wf-habit-002-mini-field-layout`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version on main: `0.5.0`; Android source `versionCode 92`; package `com.weekflow.app`.
- `WF-HABIT-001` is merged and Habits/Jardín core exists in main.
- User physical QA found a UI defect in the mini-version field: the long placeholder wraps/clips on Android.

## Product context / active scope
- Current roadmap focus: `0.5.x — Habits + Jardín`.
- This session is a narrow bug fix inside the active module.
- Smart Import remains frozen until 0.8.x.

## Baseline
- PASS — `WF-HABIT-001` PR Quality passed before merge.
- PASS — main 0.5.0 contains flexible habits runtime and persistence.
- FAIL (physical UI QA) — long mini-version placeholder clips into a second line inside a fixed-height input.

## Next action / constraints
- Active spec: `WF-HABIT-002 — Campo de mini-versión legible`.
- Keep the fix presentation-only; no habit data/model/persistence changes.
- Preserve keyboard-aware behavior and existing form actions.
- Publish technical 0.5.1 / source Android versionCode 93 if Quality and release pipeline pass.
