# TLC Initialization Snapshot — WF-MOVE-012 (2026-10-28)

## Repository/ref and baseline
- Repo `LoloscarPrr/WeekFlow`, current main `d829d467fc94ee8b5c51848298caf473c1b98252` WeekFlow 0.5.32; work branch `perf/wf-move-012-confirmed-plan-snapshot` rebuilt from v0.5.31 after concurrent weekly Habits enhancements.
- Expo SDK 57, RN 0.86, Android `com.weekflow.app`; persistent signing and version-code strategy unchanged.
- Main 0.5.32 Quality #40726620148 PASS; Android #40726619538 IN PROGRESS at time of rebuild.
- WF-MOVE-012 prior branch Quality #40726600499 PASS against 0.5.31 (TS, tests, Metro); rerun on 0.5.32 before merge.
- Device test/actual performance profiling: NOT RUN.

## Context and sources
- Blueprint Maestro v4.0, root AGENTS and TLC skill, specs WF-MOVE-009/010/011 and WF-BRAIN-016.
- `MovePlan` synchronously reads confirmed week in render; controller reads same plan at input/focus event. Need preserve tap/deeplink validation while eliminating render-time SQLite.
- v0.5.32 adds habit availability and date-exception state and tests; all package scripts/Brain code retained.
- No schema changes, key renames, visual changes, signing changes, Move-Pills, or classic importer work.

## Decision
- NOW WF-MOVE-012: focus-time confirmed slot snapshot; live validation on prepare, stale invalidation, pure and structural regression checks.
- BACKLOG broader NowView render optimization/SQLite async and profiling.
