# TLC Initialization Snapshot — WF-CORE-008, 2026-10-19

## Repository and ref
- LoloscarPrr/WeekFlow; base `main` at `2c95a386cedee7beb75cea173f49525884d85847`.
- Branch: `fix/wf-core-008-expo-image-sdk57`.
- Product source: WeekFlow Blueprint Maestro v4.0 and active 0.5.12/0.7.x specs; only release compatibility in scope.

## Current version and release
- App: WeekFlow 0.5.12, package `com.weekflow.app`, Android source versionCode 104; CI assigns monotonically increasing build versionCodes.
- Quality: PASS #39252334796.
- Android: FAIL #39252334493 in `:app:checkReleaseAarMetadata` with `expo.modules.image:expo.modules.image:58.0.15` requiring compileSdk >= 37; Expo SDK 57 native build uses compileSdk 36 and AGP 8.12.0.
- Expo publication metadata normalizer: PASS (patched one nested dependency), so prior missing publication.version error is resolved.

## Active spec
- `WF-CORE-008` (NOW): force nested Expo-image SDK 57-compatible version; preflight nested dependency versions.
- Existing UX/Move behavior from WF-UX-002/WF-MOVE-009 preserved.

## Scope and constraints
- Only `package.json`, CI workflows, script/tests, spec.
- No user app logic/SQLite, assets, keystore, Gradle, SDK bump, or UI modifications.
- Physical Android QA not available in CI; APK must first be generated and verified.
