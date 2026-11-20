# TLC Initialization Snapshot — WF-NOTIFY-010 (2026-11-19)

## Repository and ref
- Repo: `LoloscarPrr/WeekFlow`; base `main` SHA `cee59aa5b73610377537d570eb7aa98573215fcd`; working branch `feature/wf-notify-010-canonical-rest-rosters`.
- Current app version `0.5.39` (app.json, package.json, package-lock.json); Android `com.weekflow.app`, repository versionCode 114 and monotonic CI signed release versionCode.
- Expo SDK 57; React Native 0.86; Android local-first/SQLite.
- Branch and identity confirmed; previous consolidation `WF-BRAIN-019` merged on main.

## Canonical product basis
- Blueprint Maestro v4.0, 2026-09-30, section Core/Rest/Notifications: real dates, midnight rollover, canonical calendar, protected sleep, no spam, physical QA and reversible actions.
- Read repository `AGENTS.md`, `.agents/skills/tlc-spec-driven/SKILL.md`, current notification code, service, screen and tests; existing specs `WF-NOTIFY-004`, `WF-NOTIFY-007`, `WF-NOTIFY-009`, and weekly two-roster architecture.
- This is **consolidation phase 2**, not a new feature. Next spec: `WF-NOTIFY-010`, canonical weeks for Smart Silence.

## Baseline and status
- GitHub Actions `Quality` and `Build WeekFlow Native Android` on `main` SHA `cee59aa`: **PASS**, run 44553905101 and 44553905189 (2026-11-19).
- Local TypeScript/test execution: **NOT RUN**; new branch CI is mandatory.
- Native 24h / 48h notification delivery and Xiaomi permission verification: **BLOCKED** pending physical Android test. Signed release passing is not proof of delivery.

## Verified problem / constraints
- `src/notifications/smartSilence.ts` calculates a 14-day window by repeatedly selecting a shift from **the same current week schedule**, including previous Sunday and next week.
- `src/state/weekScheduleWindow.ts` already has authoritative `loadWeekForDate(date)`: prior, current, next; unprepared dates return an explicit empty week.
- `src/services/notifications.ts` currently passes only `loadWeekState()` to Smart Silence, and `app/notifications.tsx` shows next rest from the same repeated roster.
- Scope: allow pure planner to resolve each date via canonical schedule, wire both native scheduler callsites and settings display, verify regression around next-week and previous Sunday; preserve priority exceptions, user preferences, SQLite, notification permission flows, signing key, package ID, tests 5s/24h and scheduling engine.
- Proposed technical display version: `0.5.40` with monotonic versionCode via existing workflow; full build and phone validation required.
