# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`
- Base ref: `origin/main`
- Working ref/branch: `codex/wf-comm-003-play-candidate`
- Latest relevant commit: `8a09261aa0177a576257c02baf5c5ddc91a0d090` — verified WeekFlow 0.3.15 Android release.

## App / build state
- Source version: `0.3.15`; Android source `versionCode`: `70`.
- Published AAB: package `com.weekflow.app`, version `0.3.15`, CI `versionCode` `100120`.
- The published AAB validates successfully, is release-signed, targets API 36 and includes 16 KB-aligned 64-bit native libraries.

## Product context
- Current Blueprint Maestro: v3.2, Part VII / C1 Public Preview.
- Current product focus: prepare one Free/Premium-capable app for Google Play testing without enabling billing or weakening the offline-first core.
- Relevant decisions: D-001 reduce user burden; D-017 one app and codebase; D-018 useful Free tier; D-019 parallel Google Play track; D-020 validate distribution before monetization.

## Specs
- `WF-CORE-005 — Firebase + Crashlytics`: DONE; automatic Crashlytics collection is disabled in the release manifest.
- `WF-COMM-001 — Free/Premium entitlement foundation`: implementation/tests pass, but the status header remains stale at VERIFYING.
- `WF-COMM-002 — Google Play public-preview build foundation`: release evidence passes, but the status header remains stale at IMPLEMENTING.
- Proposed next spec: `WF-COMM-003 — Google Play privacy and release candidate`.

## Relevant implementation surface
- Privacy entry point: `app/assistant.tsx`; new policy screen under `app/`.
- Crash reporting: `src/observability/crashlytics.ts`, app startup in `app/_layout.tsx`, SQLite key-value persistence.
- Android manifest inputs: `app.json` and Expo prebuild.
- Commercial/release docs: `docs/commercial/`, `PRIVACY_POLICY.md`, version metadata and changelog.

## Baseline
- Local TypeScript + tests: `PASS` — `npm run quality` on `origin/main` content.
- Published 0.3.15 AAB validation/signature/API level: `PASS`.
- Previous main Quality and Android release workflows: `PASS` for 0.3.15.
- Play Console setup, Play App Signing selection and Play-delivered update test: `NOT RUN` / external.

## Constraints / uncertainties
- No authenticated Play Console capability is available in this session; external declarations and track rollout cannot be completed from the repository.
- The current app has no in-app privacy-policy access and no canonical public privacy-policy document.
- The current release manifest contains unused `SYSTEM_ALERT_WINDOW`; it must be blocked before the Play candidate build.
- Store screenshots must depict the final candidate on a real device and remain an external capture gate.

## Next TLC action
- Lock `WF-COMM-003`, implement the smallest privacy/manifest/release slice, verify every repository criterion, then build the signed 0.3.16 APK and AAB through CI.

> Rule: do not convert `NOT RUN`, `UNAVAILABLE`, or uncertainty into an assumed PASS. Initialization establishes context; the feature spec still defines what must be built.
