# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `628083b7cbe2f35073e41021c1235e3311550cda`.
- Working branch: `codex/wf-habit-003-flexible-replanning`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.1`; source Android `versionCode 93`; package `com.weekflow.app`.
- Main Quality #226: PASS.
- Android #160: PASS; signed APK/AAB release pipeline completed.

## Product context / active scope
- Current roadmap focus remains `Habits + Jardín`.
- v4.0 requires weekly frequency, viable reprogramming when reality changes, mini-versions, and a non-punitive Garden representation.
- `WF-HABIT-001` delivered the flexible habit core; `WF-HABIT-002` fixed mini-version field readability on small Android screens.
- Smart Import remains frozen until the Brain block and is out of scope.

## Habits / Garden audit
- Habits persist locally in `habits-state` through the existing `SQLiteStateStore`.
- Current model supports name, optional mini-version, weekly target, full/mini daily completion and undo.
- Current model has no concept of a preferred next day and Garden cannot express “hoy no cabe; lo hago otro día”.
- A strict weekday schedule would contradict the flexible-frequency principle, so replanning must remain an optional next-occasion preference rather than a deadline.

## Baseline
- PASS — main Quality #226.
- PASS — Android #160 signed release pipeline.
- PASS — Habits core + Garden structural regressions.
- FAIL (product gate) — Habits cannot yet be reprogrammed when the week changes.

## Next action / constraints
- Active spec: `WF-HABIT-003 — Reprogramación flexible sin culpa`.
- Add one optional `plannedFor` local date per habit.
- Keep completion possible before that date; it is guidance, not a lock.
- No automatic Brain scheduling, no notifications, no penalties, no streaks.
- Preserve existing habit history and persistence without SQLite migration.
- Publish as technical `0.5.2` / source Android `versionCode 94` if verification passes.
