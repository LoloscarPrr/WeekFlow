# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`.
- Base ref: remote `main` at `d6d1d37526b460bd4a2d99f63eb9911c2958d7f2`.
- Working ref/branch: `codex/wf-account-001-email-auth`.
- Latest relevant implementation commit: `9aac648896b3efc0ded92e99d8bf5ad52ea6826a` — adaptive Move; `d6d1d37526b460bd4a2d99f63eb9911c2958d7f2` only closes its spec.

## App / build state
- Source version: `0.3.19`; Android source `versionCode`: `74`.
- Package: `com.weekflow.app`.
- Latest main Quality: PASS — run #156 at `d6d1d37526b460bd4a2d99f63eb9911c2958d7f2`.
- Latest native Android release build: PASS — run #139 at `9aac648896b3efc0ded92e99d8bf5ad52ea6826a`.

## Product context
- Current Blueprint Maestro supplied for this session: v3.3, cut 17-09-2026.
- v3.3 keeps Core offline-first and says backend is only justified when synchronization/scale requires it.
- v3.3 defines `UserProfile` as name, schedule name, personality and preferences.
- v3.3 reserves Premium backup/synchronization for the point where an account exists.
- The user explicitly approved opening the WeekFlow account layer now.
- Current repository privacy copy explicitly says WeekFlow does not create accounts, so it must change together with account support.

## Specs
- `WF-MOVE-003`: DONE.
- `WF-COMM-001`: DONE; Free/Premium remains one app and billing stays disabled.
- `WF-COMM-003`: DONE historically; its “no Auth/account” limitation is superseded only by the new account spec.
- Proposed active spec: `WF-ACCOUNT-001 — Cuenta WeekFlow con Firebase Auth`.

## Relevant implementation surface
- Navigation / entry point: `app/assistant.tsx`, Expo Router.
- New account UI: `app/account.tsx`.
- Local profile: `src/domain/entities/UserProfile.ts`, defaults, migration and SQLite repository.
- Firebase foundation already present: `@react-native-firebase/app`, Crashlytics, `google-services.json`.
- Privacy: `app/privacy.tsx`, `PRIVACY_POLICY.md`.
- Build/install: `package.json`, `app.json`, Android GitHub Actions workflow.

## Baseline
- TypeScript + regression suite: PASS via Quality #156.
- Native Android release build: PASS via Android #139.
- Firebase Email/Password provider state in Firebase Console: UNAVAILABLE from repository access.
- Physical account-flow verification on Android: UNAVAILABLE until a new APK is installed and the Firebase provider is enabled.

## Constraints / uncertainties
- Account must be optional; Core flows remain usable offline and signed-out.
- Signing out or deleting the cloud identity must not silently erase local WeekFlow data.
- No Firestore/cloud schedule sync in this spec; that becomes a separate sync spec.
- No Google/Apple/social login, billing activation or entitlement-server validation in this spec.
- Firebase Email/Password authentication must be enabled in the Firebase project for create/sign-in/reset to work at runtime; code/build cannot prove that console setting.
- Privacy copy must distinguish local planning data from account identity data handled by Firebase Authentication.

## Next TLC action
- Lock `WF-ACCOUNT-001`, then implement optional email/password account flows, local profile name, privacy updates and regression coverage. Verify CI and Android release before DONE.

> Rule: do not turn UNAVAILABLE console/device checks into PASS.
