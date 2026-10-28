# TLC Initialization Snapshot — WF-NOW-002 (2026-10-28)

## Repository/ref and baseline
- Repository `LoloscarPrr/WeekFlow`, base main `4f4af6f587305cb525a2473d50bafaff35da1f9d` (WeekFlow Alpha `0.5.32`), branch `perf/wf-now-002-planning-state-snapshot`.
- Android package `com.weekflow.app`; signing secrets, app.json and versionCode policy unchanged.
- Main Quality #40727261145 PASS and signed Android #40727261182 PASS. Physical device timing / battery profiling NOT RUN.

## Source of truth, relevant modules, constraints
- Blueprint Maestro v4.0, `AGENTS.md`, `.agents/skills/tlc-spec-driven/SKILL.md`, `WF-NOW-001`, `WF-BRAIN-016` and `WF-MOVE-012` guide preserving Now priority, overnight shifts, confirmed work and stale-plan safeguards.
- `src/presentation/now/useNowController.ts` refreshes the displayed time every 30 seconds, recomputing `getNowView` for changing phase/progress and upcoming events.
- `src/application/useCases/getNowView.ts` synchronously reads the confirmed plan (`brain-confirmed-weekly-plan-v1`), habits (`habits-state`) and Move history (`move-history`) during each recomputation.
- The controller also independently calls `moveSessionDoneToday`, which rereads the same Move history.
- Confirmed plan relevance, completed habits/Move and upcoming-time filters must remain time-based; do not cache the final `NowView` for an entire focus period.
- The Now screen already refreshes when focused and when pull-to-refresh is used. Other screens changing data return focus before it is displayed.
- Current product changes in 0.5.32 (Habit availability and date exceptions, weekly Move/Now integration) must stay intact.
- Native device testing, measured render cost, CPU/battery impact: UNAVAILABLE in CI.

## Decision
- NOW `WF-NOW-002` — cache only a read-only canonical planning snapshot on mount and focus/explicit refresh, then pass it into pure time-based `getNowView` computations; derive today's Move completion from the same snapshot.
- BACKLOG — notifications persistence scheduling, async SQLite migration, alternative push-based invalidation while Now stays focused, full profiler-backed optimizations.
