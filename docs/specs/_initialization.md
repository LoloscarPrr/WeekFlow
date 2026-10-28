# TLC Initialization Snapshot — WF-MOVE-011 (2026-10-28)

## Repository/ref and baseline
- Repository `LoloscarPrr/WeekFlow`, current main `5f669531fbd5ed61efe485dd941185de7566aa95`, version `0.5.30`. Work branch `perf/wf-move-011-timer-cadence`, updated from v0.5.29 base to current v0.5.30 without reverting Move/Now enhancements.
- Current Expo ~57.0.8 / React Native 0.86.0 / React 19.2.3, `com.weekflow.app`; existing release keystore and versionCode logic unchanged.
- Previous main v0.5.29: Quality #40556456140 PASS; signed Android #40556456169 PASS. New main v0.5.30 CI pending verification at rebase.
- WF-MOVE-011 PR Quality #40636114871 attempt 2 PASS against v0.5.29; attempt 1 canceled while npm ci exceeded 10-minute timeout. Full Quality must be re-run on v0.5.30 head.
- Android physical stopwatch/CPU performance test NOT RUN.

## Source context and roadmap
- Blueprint Maestro v4.0 and WF-MOVE-009/010: stable Move, 30/45/60 minute training, canonical SQLite, preserving history and pause behavior.
- v0.5.30 adds `prepareWeeklySessionById` to Move for confirmed appointments in Ahora. The timer refactor must preserve that API and its matching screens/tests.
- `src/move/useMoveController.ts`: 500 ms setInterval and per-tick shift computation, while elapsed time derives from absolute phase/session timestamps. Overnight carry may end within a day and must be updated by minute rather than day.
- Scope: pure timer cadence, minute memoization, regression tests. No UI/schema/signing/version upgrade.
- Phase decision NOW WF-MOVE-011; BACKLOG for background scheduling changes and device profiling.

## Checks
- Parent main v0.5.30 Quality/Android need live verification.
- WF-MOVE-011 new PR head Quality NOT RUN at rebase.
