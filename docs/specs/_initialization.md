# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`.
- Base ref: remote `main` at `19c6b8579ce216b5163923cbb24f76015069f19f`.
- Working ref/branch: `codex/wf-move-003-adaptive-profile-equipment`.
- Latest relevant commit: `19c6b8579ce216b5163923cbb24f76015069f19f` — Android SDK workflow repair; current main builds successfully again.

## App / build state
- Source version: `0.3.19`; Android source `versionCode`: `74`.
- Package: `com.weekflow.app`.
- Latest main Quality run: `PASS` — run #152 at `19c6b8579ce216b5163923cbb24f76015069f19f`.
- Latest main native Android build: `PASS` — Build WeekFlow Native Android run #138 at the same commit.

## Product context
- Current Blueprint Maestro supplied for this session: v3.3, cut 17-09-2026.
- Canonical Move intent: guided sessions adaptable to energy, available time and equipment; Move remains wellbeing guidance, not diagnosis or rehabilitation.
- `MOV-08 Adaptación completa` is partial and calls for adaptation by workday, energy, time, experience and preferences.
- `MOV-09 Equipamiento` calls for alternatives without equipment and with user-informed equipment.
- The user explicitly requested that routines also account for body weight / physical context, goals, actual available loads and tools, while avoiding simplistic somatotype labels.
- Current implementation already adapts recommended duration from energy, work shift and previous feedback, and already supports focus, chair/floor availability, avoided areas and exercise swapping.

## Specs
- `WF-MOVE-001 — Zonas a evitar en Move`: DONE.
- `WF-MOVE-002 — Intensidad y calidad real de Move`: repository status remains LOCKED although much of its intended library/focus behavior is present on main; do not silently rewrite its historical scope.
- Proposed next spec: `WF-MOVE-003 — Perfil adaptativo y equipamiento real`.

## Relevant implementation surface
- Adaptation model and preference migration: `src/move/adaptation.ts`.
- Exercise compatibility and routine generation: `src/move/library.ts`.
- Runtime/controller integration: `src/move/useMoveController.ts`.
- Move planning UI: `src/move/MovePlan.tsx`, `src/move/MoveHome.tsx`, `src/move/styles.ts`.
- Persistence facade: `src/state/persistence.ts`; Move preferences are stored as JSON through `sqliteStateStore`, so backward-compatible sanitization can extend the format without a SQLite schema migration.
- Regression coverage: `tests/move-adaptation.test.ts`.

## Baseline
- TypeScript + regression suite on current main: `PASS` via Quality run #152.
- Native Android release build on current main: `PASS` via Build WeekFlow Native Android run #138.
- Physical-device verification of the new Move UI: `UNAVAILABLE` until an APK containing this spec is installed and exercised.

## Constraints / uncertainties
- Blueprint v3.3 contains an older snapshot of public version/build state than repository main. For implementation mechanics and release metadata, current `main` is authoritative; for product intent, the current Blueprint remains authoritative.
- Daily energy currently has four canonical levels: `vigoroso`, `bien`, `cansado`, `agotado`; this spec must not invent a parallel energy model.
- Weight and height are context, not diagnostic data. Do not derive BMI categories, somatotypes (`ectomorfo/mesomorfo/endomorfo`) or medical conclusions.
- Equipment/load adaptation must never choose an exercise that conflicts with avoided areas, floor/chair restrictions or the user-declared equipment inventory.
- Legacy Move preferences must keep loading with safe defaults.
- Existing active-session, pause/progress, feedback and history behavior must remain intact.

## Next TLC action
- Lock `WF-MOVE-003`, then extend the existing preference/compatibility engine with a Move profile, goals, experience, equipment with declared loads, and an energy/feedback-derived intensity profile. Verify migration, routine selection, swaps and regressions before considering release metadata.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature spec still defines what must be built.
