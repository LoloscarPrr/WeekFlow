# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `main`
- Working ref/branch: `feature/wf-commercial-001-entitlements`
- Latest relevant commit: `cc557c8ccd8d5f7029b893fc1984b0084ca305e2` — WeekFlow 0.3.14 / Move focus refinement

## App / build state
- App version: `0.3.14`
- Android versionCode/build metadata in source: `69` (release workflow replaces it with a monotonic CI value)
- Package/application id: `com.weekflow.app`

## Product context
- Current Blueprint Maestro: `WeekFlow_Blueprint_Maestro_v3.2.docx`
- Current roadmap/product focus: continue the functional roadmap while running the commercial Google Play track in parallel.
- Relevant product decisions: D-017 one app and one codebase for Free/Premium; D-018 Free must be useful on its own and Premium monetizes automation/depth/convenience; D-019 commercial track runs in parallel; D-020 purchases remain disabled until distribution is prepared and validated.
- Commercial rule: do not create or maintain separate Free and Premium APKs/packages. Access is controlled by entitlements/capabilities inside the same app.

## Specs
- Active/relevant specs:
  - `WF-CORE-001 — Adopt spec-driven development — DONE`
  - `WF-CORE-002 — TLC initialization — DONE`
  - `WF-CORE-003 — Adaptive multiple-layout shell — DONE`
  - `WF-CORE-005 — Firebase Crashlytics — DONE`
  - `WF-MOVE-002 — Move intensity and quality — DONE`
- Existing commercial implementation:
  - `src/commercial/entitlements.ts`
  - `tests/commercial-entitlements.test.ts`
- Proposed spec:
  - `WF-COMM-001 — Free/Premium entitlement foundation`

## Relevant implementation surface
- Modules likely affected:
  - `src/commercial/entitlements.ts`
  - `tests/commercial-entitlements.test.ts`
  - `docs/specs/`
- Build/release surface checked:
  - `app.json`
  - `.github/workflows/build-weekflow-native.yml`
- Persistence/migration surface:
  - `NONE` for this foundation step; no user data schema changes.
- Shared/sibling behavior to protect:
  - Free core: Semana, Ahora/Día Vivo, Ya salí, momentos importantes, almacenamiento offline, Rest/Move/Food básicos y correcciones manuales.

## Baseline
- Type/static checks: `PASS` on latest main Quality run #110 for `cc557c8`.
- Tests: `PASS` as part of Quality run #110 for `cc557c8`.
- Build/CI: `PASS` on Build WeekFlow Native APK run #117 for `cc557c8`.
- Known pre-existing failures: `NONE OBSERVED` from latest main CI.

## Constraints / uncertainties
- Current commercial code already defines tiers and a feature map, but it is a foundation rather than Google Play purchase activation.
- Billing must remain disabled in this spec.
- No separate product flavors/APKs are introduced because that would contradict Blueprint v3.2.
- No device simulator is available through the connector; runtime UI verification is outside this foundation-only scope.

## Next TLC action
- Proposed spec: `WF-COMM-001 — Free/Premium entitlement foundation`
- Reason: make the commercial access model explicit, fail-safe and testable while preserving one package/update line and keeping purchases off.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature/bug spec still defines what must be built.
