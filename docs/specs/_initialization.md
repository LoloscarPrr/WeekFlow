# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `9a06e7f0fd402663467d4311f6d413b778798793`.
- Working branch: `codex/wf-garden-002-responsive-cards`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.3`; source Android `versionCode 95`; package `com.weekflow.app`.
- Main Quality #231: PASS.
- Android #162: PASS; signed APK/AAB release pipeline completed.

## Product context / active scope
- Current roadmap focus remains `Habits + Jardín`.
- `WF-GARDEN-001` restored Jardín as the non-punitive catastro of the eight canonical pillars and moved Habits management to its own route.
- Physical Redmi QA exposed a small-screen layout defect: `Alimentación` can split as `Alimentaci / ón` because the lateral status chip steals title width.
- Smart Import remains frozen and out of scope.

## Garden responsive audit
- Current pillar cards place icon, title/evidence body, status chip and optional arrow in one horizontal row.
- `Necesita atención` is materially wider than the other states and can squeeze long titles on narrow devices or with larger system text.
- Unsupported pillars correctly show `Sin datos`; their cards can be slightly more compact without changing product semantics.
- Data sources, routes, status semantics and Habits persistence are already correct and must not change.

## Baseline
- PASS — main Quality #231.
- PASS — Android #162 signed release pipeline.
- PASS — Garden data/source regressions.
- FAIL (physical UX gate) — long pillar titles can wrap inside words on narrow Android layouts.

## Next action / constraints
- Active spec: `WF-GARDEN-002 — Tarjetas de Jardín responsivas`.
- Give the title its own row with the navigation arrow; move evidence/status to a flexible wrapping row.
- Compact `Sin datos` cards while preserving readability.
- No data, persistence, routes, scores, status semantics or Habits behavior changes.
- Target technical release: `0.5.4` / source Android `versionCode 96` if verification passes.
