# WF-CORE-009 — Restore Android release bundling after npm lockfile adoption

Status: LOCKED
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: Android build regression repair · 2026-10-26

## Problem
Both 0.5.25 and 0.5.26 Android CI builds fail in `:app:createBundleReleaseJsAndAssets`: Expo Router imports `expo-linking`, which is not installed by `npm ci` using the locked dependency tree. The app manifest does not list `expo-linking`. The lockfile still has root version 0.5.25 while the app is v0.5.26.

## Desired behavior
The package tree explicitly includes a compatible Expo SDK 57 `expo-linking`, its npm lockfile matches `package.json`, a clean `npm ci` resolves the module and Metro bundles Android. Quality and the signed Android APK/AAB release pass with no change to app behavior.

## Roadmap fit
- Phase decision: NOW
- Reason: blocked Android release is a critical delivery regression; repairing the existing app is prerequisite to further features.

## Scope
- Add the Expo-SDK-57-compatible `expo-linking` dependency to `package.json`.
- Regenerate `package-lock.json` using npm; preserve `.npmrc` peer policy and `npm ci`.
- Add a regression guard that catches missing `expo-linking` during Quality before expensive Android build.
- Verify Metro export and signed Android workflow. A temporary lockfile-generator workflow may be used and must be removed.

## Non-goals
- Changing runtime navigation, notifications, Brain/Move/Food/Rest, SDK major versions, native signing, Firebase/Supabase, visual assets or user data.
- Updating other packages without a demonstrated dependency need.
- Broad refactoring or version bump.

## Acceptance criteria
- [ ] AC1 — Manifest includes a compatible `expo-linking` direct dependency and lockfile resolves it; lockfile root metadata matches 0.5.26.
- [ ] AC2 — Fresh `npm ci` resolves `expo-linking` and passes the existing Quality suite.
- [ ] AC3 — Android Metro bundling succeeds under production parameters.
- [ ] AC4 — Signed Android build produces both standalone APK and Play AAB on main; existing signing/version code/release behavior is preserved.
- [ ] AC5 — A guard in Quality fails if required Router dependency is unavailable, and no temporary workflow remains.
- [ ] AC6 — Application code, stored data schema, UI and all existing user behavior remain unchanged.

## Data / persistence impact
NONE. `weekflow.db`, migration paths, and notification schedule behavior remain untouched.

## UI / UX impact
NONE. No changes to navigation, onboarding or screen layouts.

## Edge cases / regressions
- `npm ci` with `legacy-peer-deps` does not install optional Expo Router dependencies on its own.
- Keep React 19.2.3/React Native 0.86.0/Expo 57.
- Re-run full `npm run quality` and Android signing workflow; do not mistake an old APK release for this commit.
- Check that router direct import and Metro production bundle are satisfied without secrets in the client bundle.

## Verification plan
- [ ] Compare lockfile and manifest after npm install in CI.
- [ ] `npm ci`, explicit `require.resolve('expo-linking')`, `npm run quality`.
- [ ] Production Android Metro bundle as smoke test.
- [ ] Merge green PR and inspect Android workflow signed APK, Play AAB and artifact/release state.
- [ ] Record evidence for each AC.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
