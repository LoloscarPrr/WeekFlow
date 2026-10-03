# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `aac1c3f3309443d601a2fa89c44f1edd84e324d7`.
- Working branch: `codex/wf-garden-001-pillar-catastro`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.2`; source Android `versionCode 94`; package `com.weekflow.app`.
- Main Quality #228: PASS.
- Android #161: PASS; signed APK/AAB release pipeline completed.

## Product context / active scope
- Current roadmap focus remains `Habits + Jardín`.
- v4.0 defines Jardín as a non-punitive representation of balance between the eight pillars, never a life score.
- `WF-HABIT-001` through `WF-HABIT-003` delivered flexible habits, readable mini-version input and non-punitive replanning.
- Current `app/garden.tsx` is dominated by habit creation/completion, so the Garden no longer reads primarily as the intended pillar overview.
- Smart Import remains frozen and is out of scope.

## Garden audit
- Real local data already exists for Move history, Food history, Rest planning and Habits.
- The canonical eight pillars are Descanso, Alimentación, Movimiento, Relaciones, Bienestar, Hogar, Responsabilidades and Tiempo personal. Habits is a supporting module, not a ninth pillar.
- Move, Food and Rest can expose real, current evidence without introducing a new schema.
- Relationships, Wellbeing, Home, Responsibilities and Personal time do not yet have reliable persisted signals; Garden must say `Sin datos` rather than inventing metrics.
- Existing habit data must remain accessible and preserved while Garden is restored as the overview.

## Baseline
- PASS — main Quality #228.
- PASS — Android #161 signed release pipeline.
- PASS — Habits core + flexible replanning regressions.
- FAIL (product gate) — Garden is currently a habits screen rather than the canonical pillar catastro.

## Next action / constraints
- Active spec: `WF-GARDEN-001 — Catastro visual no punitivo de pilares`.
- Move Habits management to its own route without changing its stored data or behavior.
- Garden shows all eight pillars, real evidence for Move/Food/Rest, and `Sin datos` for unsupported pillars.
- No numeric life score, streak, ranking, arbitrary perfection percentage or invented data.
- Preserve existing routes/data and keep critical small-screen scrolling/navigation behavior.
- Target technical release: `0.5.3` / source Android `versionCode 95` if verification passes.
