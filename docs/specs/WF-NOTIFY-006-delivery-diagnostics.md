# WF-NOTIFY-006 — Diagnóstico real de notificaciones Android

Status: VERIFYING
Phase decision: NOW — reproducible notification delivery failure needs diagnostics before changing existing well-tested scheduling.
Owner: WeekFlow

## Problem
On fresh WeekFlow installs, notifications are opt-in and `app/notifications.tsx` does not reveal the OS permission or the channel status. A sync reports only newly created requests (often zero when unchanged), which misleadingly suggests no reminders remain. There is no isolated native test to distinguish OS delivery failure from absence of scheduled agenda events. Android 14+ can deny special alarm access, and the manifest does not explicitly declare `SCHEDULE_EXACT_ALARM`.

## Desired behavior
Notification settings show whether the app-level toggle, OS notification permission and Android channel are active, plus the total managed native scheduled requests. A dedicated 5-second local test schedules exactly one test alert without touching existing plan reminders. The app guides users to notification, special-alarm and battery/autostart settings with accurate caveat that scheduled != delivered.

## Scope
- Add read-only native diagnostic/status and 5-second time-interval notification test in `src/services/notifications.ts`.
- Update `app/notifications.tsx` to display statuses, test button and Android settings guidance; after saving, report actual pending count rather than newly scheduled count.
- Add manifest `SCHEDULE_EXACT_ALARM` on Android.
- Add structural/regression tests and run PR Quality + signed build.
- Preserve separate WeekFlow Pills completely.

## Non-goals
- Do not silently enable master notifications, change default opt-in, Smart Silence, reminder schedule, notification channel ID, trigger time, popup text, persisted data or native signing.
- Do not claim Android exact-alarm access granted just because manifest declares it; Expo SDK 57 has no documented JS exact permission probe.
- No automatic device battery exemption request or false assurance that a test alert verifies Doze/reboot reliability.

## Acceptance criteria
1. Settings clearly show app opt-in, OS permission, Android channel and count of actually pending managed reminders.
2. An explicit 5-second test alert schedules via existing channel and doesn't replace, cancel or duplicate any other reminders.
3. Disabled app master or OS permission shown as blocked, no misleading "0 new means 0 scheduled" message.
4. Android manifest enables requesting special exact-alarm access, with clear user steps for Android 14+ and Xiaomi battery optimizations.
5. No change to existing preference keys, scheduling rules, 14-day horizon, smart silence or confirmed plans.
6. Quality and Metro PASS, signed Android workflow PASS after integration (or explicitly BLOCKED).
7. Physical delivery tests (locked screen, idle, restart) must be reported NOT RUN until a real phone verifies.

## Persistence
None. No schema changes, history edits, migrations or new notification preferences; no modifications to old WeekFlow installs' consent values.

## UX
One diagnostic card below existing settings; buttons to schedule test, refresh diagnostics and open Android app settings.

## Regression plan
Static guards confirm test is opt-in, not part of reconciliation, preserves existing master and original schedule functions. Existing notification pure tests plus full Quality, Metro and signed APK CI.

## Verification result (2026-11-03)
- AC1: PASS static/structure — statuses for app toggle, OS permission, Android channel and pending managed IDs render in `app/notifications.tsx`.
- AC2: PASS static/structure — 5-second manually triggered `TIME_INTERVAL`, no `weekflowReminderId`, no cancellation path. Real device delivery NOT RUN.
- AC3: PASS static/structure — 0-new schedule result replaced by a read of pending native IDs and explicit blocked status.
- AC4: PASS config/source — Android manifest now requests the ability to grant SCHEDULE_EXACT_ALARM; Android 14+ user access still required and unavailable to inspect in SDK 57 JS. Xiaomi/Android settings text appears. NOT guaranteed exact permission.
- AC5: PASS source and existing regressions — preference defaults, SQLite keys, protected sleep, 14-day horizon and plan reconciliation unchanged.
- AC6: PASS PR Quality #41737192929 (typecheck, regression suite, Metro). Android signed standalone build PENDING post-merge.
- AC7: BLOCKED real device — must verify locked screen, Android idle/Doze, reboot and special permissions on user's phone. Cannot claim delivery reliability without user testing.
