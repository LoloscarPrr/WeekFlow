# TLC Initialization Snapshot — WF-NOTIFY-008 (2026-11-16)

## Repository / baseline
- LoloscarPrr/WeekFlow main baseline `4c18944b4cbf46a56df4d56194555be42b4cc899`, signed WeekFlow 0.5.37; working branch `feature/wf-notify-008-exact-alarm-permission`.
- Current Expo SDK 57, expo-notifications ~57.0.7, Android com.weekflow.app. Workflow assigns monotonic versionCode and signs with the existing permanent keystore.
- User's Redmi 12 5G (Android 15, Xiaomi) shows notifications allowed and 11 scheduled reminders, but no clear exact-alarm entry in the normal Android permission list. Those screenshots do not establish whether exact alarm special access was granted.
- Existing permission `android.permission.SCHEDULE_EXACT_ALARM` is already declared in app.json. `USE_EXACT_ALARM` is not appropriate.
- Official Android documentation: check `AlarmManager.canScheduleExactAlarms()`, request via `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM` only on user action, and recheck on activity resume.
- Expo SDK57 notification APIs do not expose the exact-alarm permission methods documented in newer SDK versions. A small autolinked local Expo native module avoids risky broad SDK changes.
- Source of truth: Blueprint Maestro v4.0, `docs/specs/WF-NOTIFY-007-long-idle-reliability.md`, `src/services/notifications.ts`, `app/notifications.tsx`, `app/_layout.tsx`, release/build workflow, QA tests.
- Two old open PRs (#75, #110) are unrelated. Work isolated from main until Quality + native Android build pass.
- Previous signed Android and full Quality on main: PASS; user-device delivery at 24/48h remains BLOCKED and not implied by scheduled alarm counts.

## Phase decision
WF-NOTIFY-008 — exact alarm status and settings: NOW as a core reliability/diagnostic correction. No persistence, notification scheduling, WorkManager, autostart, Smart Silence or Doze bypass change.

## Work/verification
- Add `modules/weekflow-exact-alarms` local Android bridge for the actual OS status and user-requested settings.
- Display allowed/blocked/unavailable separately from notification and channel status; refresh on foreground.
- Keep 5-second and 24-hour diagnostic tests and plan reconciliation unchanged.
- Next release display: 0.5.38. Physical Redmi QA and alarm delivery still pending after build.
