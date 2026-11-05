# WF-NOTIFY-007 — Safe reminder replacement and 24-hour long-idle diagnostic

Status: VERIFYING
Owner: WeekFlow
Phase decision: NOW — investigate user-reproduced 24–48h delays and fix confirmed cancellation-before-scheduling window; preserve core app reliability.

## Problem
WeekFlow v0.5.34 refreshes planned DATE alarms at launch and foreground. When a plan changes, it cancels all obsolete native requests before creating replacements. If creation fails, valid prior reminders are already gone. The 5-second `TIME_INTERVAL` test checks immediate delivery, not the DATE alarm behavior that Android may delay during Doze. Existing counts after opening the app may mask what Android had registered before the refresh.

## Desired behavior
- On a plan update, create/verify all replacement native requests first, and only afterward cancel the old, invalid or duplicate requests. If a create fails, old pending alarms remain; next reconciliation cleans any partial new requests.
- Add a voluntary exact-24h DATE local notification test (same scheduling method and channel as real agenda, not a repeating timer and not treated as a real plan alarm).
- Record the count of native plan reminders before each foreground/startup reconciliation, and show in Settings how many were present before the latest sync vs afterward. Clearly distinguish programmed from delivered.
- No automatic background JS timer, no false Doze bypass claim, no new permissions/SDK upgrade, no alteration of calendar/roster/brain preferences.

## Scope
- `src/services/notifications.ts`: stage schedule-before-cancel, capture pre-sync metadata, 24h DATE diagnostic with no logical plan ID and bounded one-pending-test reconciliation.
- `app/notifications.tsx`: show last pre-sync count and explicit 24-hour test trigger/result.
- Add pure/stubbed native regression tests for failure-safe reprogramming and diagnostic test isolation. Add to existing Quality.
- Set app/package display version to 0.5.35; keep Android package and permanent signing, and let existing build workflow generate a monotonic update versionCode.
- UI text explaining the 5-second result is insufficient for long-term delivery.

## Non-goals
- Do not modify the schedule planner, 14-day horizon, Android signing, SQLite/habits/shift/Move state, saved notification opt-in, smart silence or category switches.
- Do not automatically schedule extra notifications or change user-defined reminder hours.
- No legacy alarm cleanup outside managed notifications. Avoid adding always-running background tasks.
- Do not claim reliable wake-up from Doze with SDK57 date trigger. A future SDK58 implementation is distinct and must pass Android compatibility checks.

## Acceptance
1. Existing equivalent native reminders are kept; newly needed reminders created before stale IDs are cancelled.
2. If a native schedule call throws, no old native reminders have been cancelled in that sync; partial successes are reconciled on next sync.
3. A manually activated 24-hour DATE test uses same channel as planned reminders and carries `kind:'diagnostic-long-idle'` without `weekflowReminderId`.
4. Repeating the long-idle test keeps one pending diagnostic; it must not cancel, replace or resemble planned reminders.
5. Settings presents native reminder count before the last sync and current pending count with a truthful warning that neither proves delivery.
6. Permissions, category switches, WeekFlow weekly roster, Smart Silence, persisted data and all existing tests unchanged.
7. PR Quality/TypeScript/Metro pass; after merge signed Android build success or explicitly blocked.
8. Physical 24/48h locked-device and post-reboot test: blocked until user tests on Android; neither this test nor programmatic checks prove actual delivery.

## Persistence/compatibility
No schema changes or new persisted data. The pre-sync snapshot is session-only and collected during existing native synchronization. Do not affect existing installed data or signing.

## Verification plan
- Pure TypeScript or dependency-stub JS tests against service to simulate native scheduling failure and verify no cancellation, inspect test content/trigger and duplicate handling.
- Existing notification planner/reconciliation/Smart Silence and full Quality suite, Android Metro smoke; signed build after merge.
- Real-world long-idle notification at planned time must be reported as NOT RUN pending user's device.

## Verification result — 2026-11-05
- AC1: PASS — pure regression checks stage all new native alarms before any cancellation and preserve unchanged reminders through existing reconciliation.
- AC2: PASS — mocked failure on second native schedule leaves all previous IDs untouched, with next sync free to clean partial additions.
- AC3: PASS — 24h manually triggered DATE alarm on existing channel, independent kind and no plan ID; structural regression.
- AC4: PASS — when rescheduling the test, old 24h test cancelled only after new request is accepted; real agenda not referenced or modified.
- AC5: PASS — native count recorded before replacement in module memory; settings shows before and after plus local timestamp; not a record of actual delivered notifications.
- AC6: PASS — full existing Week, Brain, Move, Rest, notification planner, smart-silence, persistence tests in PR Quality #42108691393. No persisted schema change. App display v0.5.35; existing workflow's monotonic Android versionCode and signing preserved.
- AC7: PR Quality #42108691393 PASS including TypeScript, all regression tests and Metro Android smoke. Signed standalone APK: PENDING post-merge on main.
- AC8: BLOCKED — actual Android device test needs to leave app closed for 24/48h and compare expected vs actual delivery time, plus test after reboot. The code fix does not claim to override Doze.
- First CI attempt failed because the old two-week-roster release check expected v0.5.34; updated that test and package-lock version. The final PR Quality run #42108691393 PASS.
