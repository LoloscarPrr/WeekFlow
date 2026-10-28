# WF-MOVE-011 — Ajuste de frecuencia de reloj y cómputo diario Move

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: technical stabilization; no new product feature

## Problem
`useMoveController` triggers a React state update every 500 ms during active unpaused exercise even though displayed session/phase values use integer seconds. At each update, it re-evaluates shift context and recommendations which rarely change mid-session.

## Desired behavior
Active workouts refresh their clock close to the next **phase elapsed second boundary** (roughly one update per second), using absolute timestamps and re-aligning each time. Paused or inactive sessions do not tick. Shift/recommendation context is memoized by local calendar minute, including overnight shift transitions. All existing UI and workout events remain intact.

## Roadmap fit
- Phase decision: NOW
- Reason: performance/stability work on the active Move pillar, directly following completed SQLite consolidation.

## Scope
- Add pure helper `src/move/clock.ts` computing the next one-second phase boundary from persisted start and previous pause total.
- Replace 500ms `setInterval` with a cancellable `setTimeout` aligned to each elapsed-second boundary in `useMoveController`.
- Cache shift-context calculation by minute and `doneToday` by local day.
- Pure regression tests for fractional timestamps, pause offsets, fallback, long elapsed sessions, day and overnight boundaries, plus structural guards that prevent restoring the 500ms interval.

## Non-goals
- No phase/step execution rules, countdown formula, manual pause/resume logic, automatic progression, feedback, training program, focus lifecycle or background task behavior changes.
- No new active-session data, SQLite migrations, history changes, changes to app UI, signature, version, libraries or notifications.

## Acceptance criteria
- [x] AC1 — Timer no longer uses 500ms interval; it schedules one timeout per phase elapsed-second boundary and clears pending timeout when paused, finished or phase changes.
- [x] AC2 — Clock values derive from `Date.now()` (real time), not incremented counters; phase/rest completion and manual pause transitions remain intact.
- [x] AC3 — Shift recommendation recomputation only when the minute changes or Week changes; midnight and overnight carry boundaries are preserved.
- [x] AC4 — No database, app UI, persistent keys, training session format or native release configuration changes.
- [ ] AC5 — Targeted timer tests and full Quality on PR pass; signed Android release build passes after integration (or marked BLOCKED).
- [x] AC6 — No empirical battery/CPU savings asserted without a physical-device benchmark.

## Data / persistence impact
None. Uses existing phase `phaseStartedAt` and `phasePausedTotalMs`, existing session timestamps, and unchanged canonical SQLite keys.

## UI / UX impact
Same displayed second-resolution progress, pause controls, rest countdown and auto-step transitions; updates are synchronized to phase elapsed seconds rather than polling twice per second.

## Edge cases / regressions
- Phase start with nonzero milliseconds; pause/resume with accumulated pause duration.
- Long background wait: countdown derived from absolute time when timeout fires, never by adding one tick.
- Already-expired phase and rest; manual set workouts must not auto-complete.
- Midnight, previous overnight shift carry ending at a minute boundary, current shift changes.
- Unmounted/inactive/paused session must not keep its scheduled timeout; new phase must re-arm promptly.

## Verification plan
- [ ] Pure helper timing tests and controller structural regression guards.
- [ ] Full TypeScript / Quality / Metro production bundle PR checks.
- [ ] Signed Android APK/AAB CI after merge.
- [ ] Physical Android stopwatch and CPU profiling: document NOT RUN if unavailable.

## Verification result
- AC1: PASS (source + structural test). `setInterval(...,500)` replaced by a cancellable timeout re-armed at the next phase elapsed second; paused/no-session/no-runtime branches do not schedule timers.
- AC2: PASS (pure and regression tests). `nextMoveClockDelayMs` aligns phase starts and accumulated pause offsets. Each callback samples `Date.now()`; existing `phaseElapsedMs` and `elapsedMs`, pause logic and auto-step effects are unchanged.
- AC3: PASS (pure and structure tests). Minute buckets preserve overnight carry ending at 05:00 and crossing midnight; `todayShift` recomputes if week or minute changes.
- AC4: PASS (diff review). No schema/persisted key, Move routine/feedback, UI, Android signing or dependency changes.
- AC5: PASS Quality on PR head `54f4aa15270312bdbf7759c38ceecde5bc3fcee2`, run #40636114871 attempt 2 (TypeScript, regression suite, Metro Android bundle). Attempt 1 canceled during `npm ci` due to 10-minute install timeout and never reached tests. Signed Android release: PENDING after merge.
- AC6: PASS. No CPU/battery benchmark on physical device, and no measured speedup claim.
- Physical-device verification: NOT RUN — stopwatch during long training, pause/resume, return from background and overnight transition require manual Android QA.

