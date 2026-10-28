# WF-NOW-002 — Evitar lecturas repetidas de SQLite en el reloj de Ahora

Status: LOCKED
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: bounded technical stability/performance improvement · 2026-10-28

## Problem
`getNowView` is called every 30 seconds by the Now controller clock and queries three independently stored SQLite/JSON records on each tick (confirmed weekly plan, Habits, Move history). The controller additionally reloads the Move history to determine whether Move is done today. This synchronous work is unnecessary when only the wall clock changed, yet hiding a full derived NowView cache would break shift, midnight and completed-session visibility.

## Desired behavior
Now loads canonical plan, Habits and Move history once when mounted and again on screen focus or pull-to-refresh. Every clock tick still recomputes `getNowView` against current time and the last loaded snapshot, without database queries, and derives today's Move status from that same snapshot. Calls to `getNowView` without an injected snapshot retain the existing canonical-read behavior for compatible callers.

## Roadmap fit
- Phase decision: NOW
- Reason: follows WF-MOVE-010/011/012 stabilization and removes repeated synchronous SQLite reads in the live Now UI without changing planning rules.

## Scope
- Add an optional typed `planningState` to `getNowView` inputs and a canonical loader.
- Pass a stable snapshot from `useNowController` (mount, focus, refresh).
- Derive `moveDoneToday` from that history using a pure date-aware helper and time of the active render (not a once-per-focus boolean).
- Add pure date rollover/Move completion and structural regression tests.

## Non-goals
- No changes to timed agenda calculation, night shift/carry, work phase, timeline, confirmation rules, notifications, background execution, Brain planner, habit or Move data format.
- No cache of final dynamic NowView across time ticks; no 30-second polling change.
- No UI, SQLite schema/migration, signing, SDK, package dependencies or update version change.
- No changes to WeekFlow Pills, OCR, Excel or PDF importers.

## Acceptance criteria
- [ ] AC1 — A Now clock tick does not call `loadConfirmedWeeklyPlan`, `loadHabitsState`, `loadMoveHistory` or `moveSessionDoneToday`.
- [ ] AC2 — Mount/focus/pull-to-refresh load a consistent planning snapshot; the view updates after returning from Habit/Brain/Move changes.
- [ ] AC3 — Current-time-dependent `getNowView` calculation still runs every 30 seconds; upcoming moments, work phase, night carry and post-shift plans are not frozen.
- [ ] AC4 — Move completion derives from snapshot history using local date every recomputation; midnight changes validity without an additional database read.
- [ ] AC5 — Plain `getNowView` calls without the optional snapshot still read current canonical state as before, preserving other callers.
- [ ] AC6 — Existing history, confirmed plan and habit persistence are read-only; no UI, navigation, signing or schema changes.
- [ ] AC7 — Full Quality regression/TypeScript/Metro passes and Android signed APK/AAB passes after merge (or is explicitly marked blocked).
- [ ] AC8 — No quantitative improvement claims without physical-device profiling.

## Data / persistence impact
No migrations or writes. Read-only keys `brain-confirmed-weekly-plan-v1`, `habits-state` and `move-history` are loaded together by canonical functions at focus, not every 30-second tick. State changes made in sibling screens become visible on focus/refresh.

## UI / UX impact
None intended. Today's Move status updates as the local date changes, and Now events continue advancing with clock time.

## Edge cases / regressions
- Midnight across Chile local time; previous-day Move should not stay marked done.
- Overnight shift carry and post-shift rest across midnight.
- Confirmed future/overdue workouts and independently completed habits.
- Switching to/from Brain, Move or Habits and returning to Now.
- No plan, empty habits, empty/legacy Move history; keep time-based filtering.
- Manual “Ya salí”, correction and replan confirmation unaffected.
- Pull-to-refresh should refresh canonical records even without screen navigation.

## Verification plan
- [ ] Pure helper tests for local midnight and Move completion.
- [ ] Structural tests confirm controller always passes planning snapshot and only refresh reads SQLite.
- [ ] Existing Now/Habits/Move/Brain regression suite, Quality and Metro Android bundle.
- [ ] Signed Android build after merge.
- [ ] Manual device navigation/overnight scenarios: NOT RUN without a physical test device.

## Verification result
- AC1–AC8: PENDING.
