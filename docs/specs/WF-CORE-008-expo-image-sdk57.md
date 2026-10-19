# WF-CORE-008 — Align nested Expo Image with SDK 57

Status: LOCKED
Owner: WeekFlow
Reported: 2026-10-19
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
After the Expo autolinking publication.version fix, Android build #39252334493 passed prebuild, native module linking and 776+ Gradle actions, then failed at `:app:checkReleaseAarMetadata`. The log identifies `node_modules/@infinitered/react-native-mlkit-text-recognition/node_modules/expo-image` version `58.0.15`; its AAR requires Android `compileSdk >= 37` while WeekFlow Expo SDK 57 uses `compileSdk = 36` (AGP 8.12.0 supports 36). The project does not declare expo-image directly and `npm install` is unpinned by a lockfile.

## Desired behavior
Pin the indirect `expo-image` dependency to the Expo SDK 57-compatible line using npm overrides without changing user features, other Expo packages, Android SDK or signing. Detect any future reintroduction of Expo-image with a mismatched major immediately after installing node_modules rather than after a long Gradle build.

## Roadmap fit
- Phase decision: NOW.
- Reason: a deterministic Android release blocker prevents distribution of approved app.

## Scope
- Package manifest npm override for `expo-image` version `57.0.5`, matching Expo SDK 57 guidance.
- Dependency-preflight script scanning installed root/nested copies, requiring same major as installed Expo and displaying offending paths on mismatch.
- Invoke preflight in Quality and native Android workflows immediately after npm install.
- Add a pure regression test proving script catches nested SDK 58 in SDK 57 and accepts SDK 57 nested copies.

## Non-goals
- Do not upgrade all SDK packages to Expo 58, Gradle, Android API target or min API.
- Do not alter import/OCR behavior, state/database, application layouts, app version, Android ID, release keystore, or secrets.
- Do not pretend Gradle build is fixed without a verified release APK.

## Acceptance criteria
- AC1: No `expo-image` 58.x present after `npm install` for Expo SDK 57.
- AC2: SDK-mismatch preflight runs before Gradle and lists unexpected installed paths.
- AC3: Pure regression tests confirm nested-major detection and valid same-major setups.
- AC4: CI Quality passes and native Android builds APK and AAB, or a concrete next blocker is recorded.
- AC5: App code, data format, Android package and permanent signing are unchanged.

## Data / UI impact
None.

## Sibling / regression checks
- Confirm ML Kit OCR integration still compiles, Expo-image picking unaffected; Test Expo 57.0.5 dependencies per official SDK 57 reference.
- Run CI on PR and native release on main; inspect AAR metadata for mismatch and saved artifacts.

## Verification
Pending.
