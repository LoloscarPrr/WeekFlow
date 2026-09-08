# WF-COMM-003 — Google Play privacy and release candidate

Status: VERIFYING
Owner: WeekFlow

## Source of truth

WeekFlow Blueprint Maestro v3.2, Part VII / C1 Public Preview, especially D-017 through D-020.

## Problem statement

WeekFlow 0.3.15 already produces a valid signed Android App Bundle, but it is not a complete Google Play candidate: users cannot reach a privacy policy from the app, Play data-handling declarations are not prepared, Crashlytics has no explicit user control, and the release manifest contains the unused `SYSTEM_ALERT_WINDOW` permission.

## Desired behavior

- A user can open a clear privacy screen from Assistant without adding noise to the core planning screens.
- The screen explains local WeekFlow data, user-initiated camera/file access, local notifications and optional crash reports.
- Firebase Crashlytics and unused Firebase Messaging auto-initialization remain disabled by default; Crashlytics is enabled only after an explicit opt-in.
- The opt-in is stored locally, applied at startup and reversible; opting out disables collection and deletes unsent reports.
- Non-fatal diagnostic recording is a no-op while consent is absent.
- The release manifest no longer declares `SYSTEM_ALERT_WINDOW`.
- The repository contains a public privacy-policy source plus accurate Play Console data-safety and store-listing drafts.
- The candidate is released as 0.3.16 without enabling billing.

## Scope

- Add an in-app privacy route and a compact entry point in Assistant.
- Add locally persisted Crashlytics consent and startup synchronization.
- Add privacy-first Firebase defaults so unused Messaging/Analytics initialization does not create identifiers automatically.
- Guard existing Crashlytics logging helpers behind consent.
- Add the canonical `PRIVACY_POLICY.md`.
- Add Play Console data-safety and Spanish (Chile) store-listing drafts.
- Block `android.permission.SYSTEM_ALERT_WINDOW` through Expo Android configuration.
- Reconcile completed C1 repository gates/spec statuses.
- Bump public version to 0.3.16 and add release notes.
- Produce and validate the signed APK/AAB through the existing GitHub Actions release workflow.

## Non-goals

- No Google Play Billing, subscriptions, paywall or purchase restoration.
- No Analytics, Auth, Firestore, cloud sync, advertising or remote push registration.
- No account-deletion flow because WeekFlow does not create user accounts.
- No Play Console writes, Play App Signing enrollment or track rollout from this spec.
- No fabricated store screenshots; screenshots must show the final candidate on a real device.
- No behavior or layout changes to Ahora, Semana, Rest, Move or Food.

## Acceptance criteria

1. Assistant exposes one compact, working `Privacidad y datos` action.
2. The privacy screen is scrollable, has a clear back action, accurately summarizes current data handling and opens the canonical public policy URL.
3. Crash reporting is OFF by default, unused Firebase Messaging auto-init is disabled, and Crashlytics can only become active through the user's explicit switch action.
4. The Crashlytics preference persists locally, is applied at app startup, and opting out disables collection plus deletes unsent reports.
5. Existing diagnostic helpers do not log or record non-fatal errors without consent.
6. `PRIVACY_POLICY.md` identifies WeekFlow, explains accessed/collected data, purpose, sharing/service providers, security, retention/deletion and a contact mechanism.
7. Repository drafts give Play Console-ready guidance for Data safety and the Spanish (Chile) store listing without claiming external steps are complete.
8. Expo prebuild produces a manifest without `android.permission.SYSTEM_ALERT_WINDOW`.
9. Package remains `com.weekflow.app`, target API remains 36 in the release AAB, billing remains disabled, and source version becomes 0.3.16 / versionCode 71.
10. Local `npm run quality` passes and includes regression coverage for default-off/persisted consent.
11. Main CI produces downloadable signed 0.3.16 APK and AAB; the AAB validates successfully.
12. Play App Signing setup, Play-delivered update/persistence test and real-device store screenshots remain explicitly BLOCKED until completed externally.

## Data / persistence impact

- Adds one additive key-value entry for crash-reporting consent in the existing SQLite store.
- No schema migration is required.
- Existing week, day, profile, Move and Food data are unchanged.
- Uninstalling WeekFlow removes local app data subject to Android backup behavior.

## UI / UX impact

- Assistant gains one compact privacy card.
- A new dedicated privacy screen contains the detailed text and consent switch, keeping the primary product screens concise.
- Crash reports are never presented as required to use WeekFlow.

## Edge cases / regressions to check

- Missing/corrupt stored consent resolves to OFF.
- Firebase native APIs being unavailable must not break app startup or the privacy screen.
- Turning consent off after it was on removes unsent reports and keeps the UI responsive.
- Returning from the privacy route preserves normal bottom navigation and screen layout.
- Public policy and in-app summary must not claim images, schedules or food/movement data are uploaded.
- The manifest retains camera, document-picker and local-notification capabilities while removing only the unused overlay permission.

## Verification plan

- Add focused tests for consent state and persistence behavior using an injected store/runtime boundary.
- Run `npm run quality`.
- Run Expo prebuild in a disposable output and inspect the merged release manifest.
- Confirm package/version/billing invariants from source and generated Android configuration.
- After PR merge, verify Quality and Android release workflows.
- Download and validate both 0.3.16 outputs; inspect AAB manifest, signature and target API.
- Record each acceptance criterion as PASS or BLOCKED before closing the spec.

## Verification record

- AC1–AC7: PASS locally — the compact action, privacy route, explicit opt-in, persisted startup behavior, guarded diagnostics, policy and Play drafts are implemented and reviewed.
- AC8: PASS at prebuild source level — Expo emits `SYSTEM_ALERT_WINDOW` with `tools:node="remove"`; the final merged AAB manifest remains pending CI inspection.
- AC9: PARTIAL — source is 0.3.16 / versionCode 71, package remains `com.weekflow.app` and billing remains disabled; target API must be reconfirmed in the candidate AAB.
- AC10: PASS — local `npm run quality` includes and passes the consent regressions.
- AC11: NOT RUN — requires merge and the signed `main` Android workflow.
- AC12: BLOCKED as designed — Play Console setup, Play App Signing, Play-delivered update/persistence and real-device screenshots require external access and a physical device.
