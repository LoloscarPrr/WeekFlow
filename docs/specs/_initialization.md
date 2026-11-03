# TLC Initialization Snapshot — WF-NOTIFY-006 (2026-11-03)

## Repository and baseline
- `LoloscarPrr/WeekFlow`, `main` `9a19e2f6cefc4b04539d1a29287a173c1a2d11fd`, version `0.5.34`; work branch `fix/wf-notify-006-delivery-diagnostics`.
- Existing main Quality #41322590058 PASS and signed Android #41322589971 PASS.
- WeekFlow Pills is separate repo; no cross-project modifications or shared app ID.
- Physical device notification/Android 15 validation: NOT RUN.

## Sources and context
- Blueprint Maestro v4.0, root AGENTS.md and .agents/skills/tlc-spec-driven/SKILL.md reviewed.
- WF-NOTIFY-001 through 005: dedup, smart silence, incremental reconciliation and fresh install opt-in are already implemented. Preserve all.
- `src/services/notifications.ts`: native Expo channel `weekflow-reminders-v2`, post-notification permission, date triggers, 14-day live plan and synchronized queue.
- `src/notifications/persistence.ts`: notifications disabled on fresh onboarding, enabled for legacy profiles. Never override user's consent.
- `app/notifications.tsx`: switches but only shows count newly scheduled, not count actually registered or Android permission; no native 5-second test.
- `app.json`: Android has no explicit SCHEDULE_EXACT_ALARM declaration; SDK 57 requires manifest declaration for exact local alarms; Android 14+ may still deny special access until enabled manually.
- Android skins (especially Xiaomi) may suppress notifications via battery/autostart; app cannot override it silently.

## Decision
- NOW WF-NOTIFY-006 — make delivery path diagnosable and testable: one local notification test, permissions/channel/current pending requests, manifest exact-alarm declaration, transparent native setting guidance, correct total scheduled count.
- BACKLOG exact-alarm native permission probe for SDK 57, Android Doze integration tests, remote push fallback, special-access deep links, smart silence redesign.
- No change to existing reminder timings, Smart Silence, per-kind prefs, schedule/dedup, SQLite or signing.
