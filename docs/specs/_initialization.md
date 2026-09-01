# TLC Initialization Snapshot

Use this once at the start of a new working session, or refresh it when repository/product context changes materially.

## Repository
- Repository: `owner/repo`
- Base ref: `main`
- Working ref/branch: `...`
- Latest relevant commit: `...`

## App / build state
- App version: `...` / `UNAVAILABLE`
- Android versionCode/build: `...` / `UNAVAILABLE`
- Package/application id: `...` / `UNAVAILABLE`

## Product context
- Current Blueprint Maestro: `...` / `UNAVAILABLE`
- Current roadmap/product focus: `...`
- Relevant product decisions: `...` / `NONE FOUND`

## Specs
- Active/relevant specs:
  - `WF-AREA-NNN — title — STATUS`
- Historical evidence consulted (optional):
  - `CHANGELOG/...`

## Relevant implementation surface
- Screens/modules likely affected:
  - `...`
- Persistence/migration surface:
  - `...` / `NONE EXPECTED`
- Shared/sibling components to watch:
  - `...`

## Baseline
- Type/static checks: `PASS | FAIL | NOT RUN | UNAVAILABLE`
- Tests: `PASS | FAIL | NOT RUN | UNAVAILABLE`
- Build/CI: `PASS | FAIL | NOT RUN | UNAVAILABLE`
- Known pre-existing failures: `...` / `NONE OBSERVED`

## Constraints / uncertainties
- `...` / `NONE`

## Next TLC action
- Proposed/resumed spec: `WF-AREA-NNN — title`
- Reason: `...`

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
