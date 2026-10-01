# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `ba9eca390919bc11bbe9ee499ff71c4d1b39d1c5`.
- Working branch: `codex/wf-habit-001-flexible-core`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0` (30-09-2026).

## App / build
- Technical app version: `0.4.9`; source Android `versionCode 91`; package `com.weekflow.app`.
- Main Quality #221: PASS.
- Android #158: PASS; signed APK/AAB and GitHub Release publication completed.

## Product context / active scope
- Core/Semana manual, Move, Food and Rest have reached their current roadmap gates.
- Current roadmap focus is `0.5.x — Habits + Jardín`.
- Blueprint gate: flexible frequency, mini-versions, reprogramming and a non-punitive Garden representation so habits survive variable weeks without guilt.
- Smart Import remains frozen until 0.8.x and is out of scope.

## Habits / Garden audit
- `app/garden.tsx` currently acts as a compact navigation surface for Rest, Food and Semana.
- There is no persisted habit model, completion model, habit editor or flexible weekly frequency yet.
- Existing `SQLiteStateStore` already supports JSON state by key, so the first Habits slice can persist without a schema migration.
- Shared keyboard-aware input/scroll infrastructure already exists and should be reused.

## Baseline
- PASS — main Quality #221.
- PASS — Android #158 signed release pipeline.
- PASS — existing Core/Move/Food/Rest regression suites.
- FAIL (product gate) — Habits + Jardín 0.5.x has no executable habit flow yet.

## Next action / constraints
- Active spec: `WF-HABIT-001 — Núcleo de hábitos flexibles`.
- First slice: create/edit a habit, flexible weekly frequency, optional mini-version, full/mini completion for today, undo and local persistence.
- No streaks, scores, punishment language or rigid weekday scheduling.
- Reprogramming across specific days is a later Habits slice; do not broaden this spec.
- Preserve existing Garden shortcuts and bottom navigation.
- Use the existing key-value SQLite state store; no database migration unless implementation proves it necessary.
- Publish as technical `0.5.0` / source Android `versionCode 92` if verification passes.
