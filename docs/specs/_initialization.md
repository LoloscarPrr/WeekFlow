# TLC Initialization Snapshot — 2026-10-19 (WF-CORE-007)

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`, base `main` at `90de69ff420db8e9cc96aa018cd55fa8fa888480`.
- Branch: `fix/wf-core-007-expo-autolinking-publication`.
- Product source: Blueprint Maestro v4.0; active 0.7.x assistant/brain with 0.5.12 stabilization.

## App / build
- Source version: `0.5.12`; Android source versionCode `104`, production package `com.weekflow.app`.
- CI Quality (main previous SHA `7174bda17`): PASS.
- Android release Oct 15 #38822812246 and Oct 19 #39251235777/#39251755922: FAIL in Gradle `settings.gradle:32` because `publication.version` missing.
- Autolinking normalization reported 0 fixes; current diagnostic script used `build/index.js` (non-executable) and logged “Unexpected end of JSON input”.

## Scope and constraints
- Active specs: `WF-UX-002`, `WF-MOVE-009` (user-visible changes already merged) and `WF-CORE-007` (NOW, Android build bug).
- Workflow: `.github/workflows/build-weekflow-native.yml`.
- No source UI/business changes, no dependency or signing changes; preserve compatible signed updates.
- Blueprint file available in project but build debugging uses current repo.
- Build verification must use GitHub Actions; Android device testing remains unverified.

## Next action
Lock `WF-CORE-007`, replace incomplete publication normalizer with executable Expo autolinking metadata validation, add pure regression tests, run PR CI, merge after PASS then verify Android build and artifacts.
