# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `main`
- Working ref/branch: `release/0.3.12-adaptive-layout`
- Latest relevant commit: `ab68e74a3e9fcba450e2f2035890fcce063dee93` — WeekFlow adaptive multiple layout

## App / build state
- App version: `0.3.11` before release metadata update
- Android versionCode/build: `67`
- Package/application id: `com.weekflow.app`

## Product context
- Current Blueprint Maestro: `WeekFlow_Blueprint_Maestro_v3.2.docx`
- Current roadmap/product focus: mantener coherencia del núcleo 0.x, cerrar comportamiento real antes de ampliar alcance y preservar una UI clara que se adapte al usuario.
- Relevant product decisions: D-011 primero estabilidad del Core/importación; D-013 Semana como editor canónico de jornadas; principio fundador “WeekFlow se adapta al usuario; el usuario no se adapta a WeekFlow”.

## Specs
- Active/relevant specs:
  - `WF-CORE-001 — Adopt spec-driven development — DONE`
  - `WF-CORE-002 — TLC initialization — DONE`
  - `WF-MOVE-001 — Move zonas a evitar — DONE`
  - `WF-CORE-003 — Adaptive multiple-layout shell — DONE`
  - `WF-CORE-004 — Release adaptive-layout APK — LOCKED`
- Historical evidence consulted:
  - `CHANGELOG-0.3.11.md`

## Relevant implementation surface
- Screens/modules likely affected:
  - `app/_layout.tsx`
  - `src/components/BottomNav.tsx`
  - shared presentation shell for all Expo Router screens
- Persistence/migration surface:
  - `NONE EXPECTED`
- Shared/sibling components to watch:
  - Ahora, Semana, Pilares, Jardín, Asistente, Food, Rest, Move and modal/navigation overlays.

## Baseline
- Type/static checks: `NOT RUN` for release branch initialization
- Tests: `NOT RUN` for release branch initialization
- Build/CI: `UNAVAILABLE` for merge commit `ab68e74`; no associated workflow runs
- Known pre-existing failures: `NONE OBSERVED` from repository state; not equivalent to a passing local build.

## Constraints / uncertainties
- Current Blueprint Maestro v3.2 records an older product snapshot (0.2.2) than repository main (0.3.11); repository version/build metadata is treated as current technical state while blueprint remains product-intent authority.
- No device simulator is available through the GitHub connector, so physical rendering verification must be recorded as BLOCKED unless CI/device evidence becomes available.

## Next TLC action
- Proposed/resumed spec: `WF-CORE-004 — Release adaptive-layout APK`
- Reason: generate the signed update-compatible APK that contains the already merged adaptive-layout implementation.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
