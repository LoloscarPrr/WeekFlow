# TLC Initialization Snapshot — WF-NOTIFY-007 (2026-11-05)

## Repository/ref
- `LoloscarPrr/WeekFlow` main `f321c94e8f60b1931b82e00165be5550a6be06a3`, WeekFlow 0.5.34, working branch `fix/wf-notify-007-long-idle-reliability`.
- Current app: Android app `com.weekflow.app`, Expo SDK 57, `expo-notifications` 57, signed main Android #41737690719 PASS and Quality #41737691005 PASS.
- Product: WeekFlow (two-week roster, Brain, Move, habit and rest); no other app in scope.

## Sources/context
- Root AGENTS.md; `.agents/skills/tlc-spec-driven/SKILL.md`; master WeekFlow Blueprint v4.0 and product scope as reflected in repository docs; WF-NOTIFY-005 and WF-NOTIFY-006 current specs; `src/services/notifications.ts`, `src/notifications/reconciliation.ts` and `app/notifications.tsx` inspected.
- User reports 5-second notification arrives with screen locked; after 24–48h without opening app, scheduled alarms can be delayed, and opening app appears to restore normal delivery.
- Native Android Doze may defer date-based notifications; Expo SDK 57 has no JS exact-alarm permission probe or `alarmClock` trigger property. SDK 58 adds both. The user has not performed a representative 24-hour DATE trigger test.
- Current reconciliation computes both obsolete native alarm IDs and new alarms, but cancels obsolete IDs before programming replacements. A native scheduling failure can therefore leave the old reminder lost.
- Current 5-second test is a TIME_INTERVAL trigger and cannot prove long-idle DATE reliability.

## Phase decision
- NOW `WF-NOTIFY-007`: stage replacements safely and provide a representative optional 24h DATE alarm test and diagnostic readout of scheduler state before reconciliation; preserve existing schedule and opt-in.
- BACKLOG `WF-NOTIFY-008`: adopt Expo SDK 58 / selected `delivery: 'alarmClock'` only for justified time-critical reminder categories, with Android permission query and native build and policy review. Do not silently migrate SDK in this bugfix.
- Do not claim Doze delivery is fixed without physical 24–48h validation.

## Baseline and uncertainties
- Quality PASS, signed Android PASS at main `f321c94e8f60b1931b82e00165be5550a6be06a3`.
- Phone background test NOT RUN; alarm special access can vary by Android version. No access to user device.
