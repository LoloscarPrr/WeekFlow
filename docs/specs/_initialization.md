# TLC Initialization Snapshot — WF-NOTIFY-009 (2026-11-17)

## Repository and baseline
- LoloscarPrr/WeekFlow `main` SHA `bf8abb6ae69ad5bdc396299bf7c947c0ee2d9aff`, signed version 0.5.38; this branch: `feature/wf-notify-009-permission-activation`.
- No active competing new PRs. Earlier historical PRs #110 and #75 do not touch this scope.
- Expo SDK 57, Android package `com.weekflow.app`, permanent release key and workflow-generated monotonic `versionCode`.
- The actual 0.5.38 APK inspected on 2026-11-17 contains the binary AndroidManifest string `android.permission.SCHEDULE_EXACT_ALARM` and DEX native class `WeekFlowExactAlarms`; this is **not** confirmation of Android user grant.
- GitHub Quality and native Android release for 0.5.38 PASS. No successful Redmi exact-alarm test established.

## User-reported issue
- Xiaomi/Redmi Android 15: WeekFlow does not appear where other applications do under special permissions. Normal notifications are enabled and a 24h DATE diagnostic was not received.
- Previous screenshot still displays 0.5.37 diagnostics (no separate exact alarm status), so version actually installed must be checked on-device.
- Android 12+ `SCHEDULE_EXACT_ALARM` is **special app access**, not a conventional runtime dialog. Official API: `AlarmManager.canScheduleExactAlarms()`, `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` via user-initiated intent. Android 14/15 may deny by default. Manufacturer can vary the Settings UI.
- Do not add Play-restricted `USE_EXACT_ALARM` or claim a permission prompt can grant the setting automatically.

## Phase decision and constraints
- NOW: make an explicit, proactive one-time rationale/offer for existing enabled reminders and an always-visible top-level action on the Notifications screen. `docs/specs/WF-NOTIFY-009-permission-activation.md`.
- Rationale comes after app onboarding, offered once, recorded in existing SQLite key/value state; only an explicit tap opens Android special settings.
- Keep notification engine, DATE/5s tests, work schedule, local history, delivery reconciliation, Smart Silence and persistence schema unchanged.
- Target display 0.5.39. Android signed build, Quality + full Metro to verify; physical Xiaomi delivery and settings outcome remains BLOCKED until user confirms.
