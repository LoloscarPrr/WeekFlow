# TLC Initialization Snapshot — WF-CORE-009 (2026-10-26)

## Repository/ref, version and baseline
- Repo: `LoloscarPrr/WeekFlow`, main `5a5d05f1b2c5016228ed28beeb7cc0ff0f75c176`; repair branch `fix/wf-core-009-expo-linking-build`.
- Current app: WeekFlow 0.5.26, source Android `versionCode=114`; package `com.weekflow.app`; Expo ~57.0.8, React Native 0.86.0, React 19.2.3.
- Quality main: PASS, run #40383397943. Android signed build: FAIL, run #40383397904, during `:app:createBundleReleaseJsAndAssets`, `expo-linking` unresolved by Expo Router. Same failure in #40351477513.
- Android signed APK/AAB for commit `5a5d05f1b2c5016228ed28beeb7cc0ff0f75c176`: NOT PRODUCED. Device QA: NOT RUN.
- `package-lock.json` root version is still 0.5.25 although app and `package.json` are 0.5.26. `npm ci` completes but Metro cannot resolve missing `expo-linking`.

## Sources and constraints
- `AGENTS.md` and `.agents/skills/tlc-spec-driven/SKILL.md` reviewed. Blueprint Maestro v4.0 governs focus on reliable Android delivery and keeping existing features.
- Existing `WF-CORE-008` requires reproducible lockfile / npm ci; its Android acceptance criterion was BLOCKED; repair it without rolling back `npm ci`.
- Android workflow builds signed APK and Play AAB from `main` via GitHub Actions using existing secrets. Do not change signing, UI, Brain, offline advice, Firebase or Supabase.
- Official Expo Linking installation recommends `npx expo install expo-linking`; SDK 57 family must remain compatible; local npm registry access unavailable.
- Lockfile must be regenerated in controlled GitHub Actions rather than hand-editing hashes.

## Decision
- NOW `WF-CORE-009`: declare SDK-57-compatible `expo-linking` explicitly, regenerate lockfile against v0.5.26, validate `npm ci`, Metro bundle and Android signed release.
- BACKLOG: dependency upgrades/Expo 58, unrelated optimizations and product work.
