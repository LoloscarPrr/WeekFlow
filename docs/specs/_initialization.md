# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `742fa0586f996dae02a2154828b448fd4fa564a0`.
- Working branch: `onboarding/wf-onb-001-minimal`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0`.

## App / build
- Technical app version: `0.5.5`; source Android `versionCode 97`; package `com.weekflow.app`.
- Main Quality #247: PASS.
- Main Android #164: PASS; signed APK + AAB published as WeekFlow Alpha v0.5.5.
- Local dependency-backed quality: UNAVAILABLE in this session; GitHub Actions is the verification runner.

## Product context / active scope
- Current canonical phase: `0.6.x — Onboarding + notifications`.
- This batch implements only the first step: minimal progressive onboarding.
- Existing account/Auth remains optional and must not become an entry wall.
- Notifications, smart silence, Brain/Assistant expansion and Smart Import are out of scope.

## Relevant repository state
- Existing `UserProfile` already persists `name` and `scheduleName`; onboarding must reuse it.
- RootLayout currently opens directly into the app and always renders BottomNav.
- Existing users may already have week/profile/Move/Food/Habits data; an update must not treat them as fresh installs.
- SQLite key/value state can store onboarding completion without a schema migration.

## Baseline
- PASS — current main/version/release inspected.
- PASS — UserProfile, SQLite state store, RootLayout and BottomNav inspected.
- PASS — prior 0.5.5 Android release/signing/update configuration verified.
- NOT RUN — branch Quality/Android (no code committed yet).

## Next action / constraints
- `WF-ONB-001 — Entrada mínima y progresiva`.
- One screen only.
- Name is optional and saved through existing UserProfile.
- Offer configure-week-now or enter-app-now.
- Existing installations with meaningful WeekFlow data auto-complete onboarding silently.
- No notification permission prompt in this spec.
- Target technical release: `0.5.6` / source Android `versionCode 98` if verification passes.
