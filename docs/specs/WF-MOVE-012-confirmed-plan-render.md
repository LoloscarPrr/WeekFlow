# WF-MOVE-012 — Evitar lectura SQLite durante render de MovePlan

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: technical performance/stability follow-up · 2026-10-28

## Problem
The UI component `MovePlan` directly calls `loadConfirmedWeeklyPlan()` during every render, synchronously reading the canonical SQLite plan. Profile and equipment updates unnecessarily repeat database/JSON work. Caching must not accept obsolete weekly plans or bypass the existing confirmation contract.

## Desired behavior
When Move becomes focused, the controller reads the current confirmed Move slots and provides a snapshot to the view. The plan view no longer touches SQLite during rendering. Preparing a weekly workout still validates its exact identity, date, start and duration against a *fresh* canonical plan before applying it. Deep linking stays non-autostart and continues to reject unknown or replaced slots.

## Roadmap fit
- Phase decision: NOW
- Reason: bounded optimization for Move/SQLite after WF-MOVE-010/011, preserving recent weekly workout features.

## Scope
- In scope: controller holds confirmed Move slot snapshot, loads on initial mount and `refreshMove` / screen focus; `MovePlan` uses snapshot instead of rendering-time DB read.
- `prepareWeeklySession` must refresh that snapshot from the canonical store at event time, including if confirmation has changed or been removed.
- Targeted regression test(s) for the behavior and its structural boundary.

## Non-goals
- Do not change dates, schedules, workout selection, duration, adaptation, the ability to prepare after the scheduled start, or how `doneToday` behaves.
- No changes to how Brain confirms/undoes plans, no SQLite schema/migration/state key changes.
- No UI layout, controls, physical signing, package dependencies, clock cadence, reminder or Move-Pills changes.

## Acceptance criteria
- [x] AC1 — `MovePlan` does not import/call `loadConfirmedWeeklyPlan` or directly read canonical SQLite in render.
- [x] AC2 — Controller reads confirmed slots on initial mount/focus; returning to Move after another screen confirmed/removed a plan refreshes displayed slots.
- [x] AC3 — Preparing a slot re-checks canonical plan and rejects replaced/removed or mutated IDs/date/start/duration; invalid selection refreshes the view instead of accepting stale data.
- [x] AC4 — Deep link still prepares only an existing slot without auto-starting; already completed daily Move and date ordering remain unchanged.
- [x] AC5 — Existing persisted records and unrelated modules are unchanged; no migration.
- [ ] AC6 — Tests/TypeScript/Metro Quality pass on PR and signed Android APK/AAB passes after merge or is explicitly BLOCKED.
- [x] AC7 — No measured performance claim without Android profiling.

## Persistence impact
NONE: reads unchanged `brain-confirmed-weekly-plan-v1` via existing `loadConfirmedWeeklyPlan`; no writes, key renames, migrations or transformations.

## UI/UX impact
NONE: same planned slot selection and button. Internal state updates on focus and verified tap; prevents stale card from lingering after invalid tap.

## Edge cases/regressions
- No plan; empty `moveSlots`; slots from earlier weeks; completed Move on scheduled date.
- Deep-linked planned workout ID replaced after view rendered; stale saved date/start/duration; canonical validation required on click.
- Resume from another screen after confirming or deleting an existing plan.
- Focus while active workout: no automatic session start; runtime, pause and workout progression untouched.
- Shift/energy/feedback adaptations still work.

## Verification plan
- [ ] Structural regression guards plus existing relevant Move and Now/Brain tests.
- [ ] PR Quality (TypeScript, unit/regression, Metro).
- [ ] Signed Android release on main.
- [ ] Physical Android navigation/cached-plan refresh check: NOT RUN until verified.

## Verification result
- AC1: PASS — `MovePlan.tsx` imports only pure selector `nextConfirmedMoveSlot`, not SQLite functions. Guard `move-confirmed-plan-cache-structure.test.cjs` protects this contract.
- AC2: PASS (structural + source) — `useMoveController` loads the confirmed slot snapshot lazily on mount and within `refreshMove` on focus; stale prepared slot is matched against the refreshed canonical slots or cleared. Device navigation QA: NOT RUN.
- AC3: PASS (structural + source) — a tap loads the live canonical plan, refreshes the cached card, rechecks ID/date/start/duration and clears any stale selected slot if invalid. Deep-link-by-ID still performs canonical lookup and calls the same validation. Device tap QA: NOT RUN.
- AC4: PASS — pure selection regression covers today, future, completed-today, expired slots, empty plans and preserved order; structural guard checks the prepared-deep-link priority. No autostart or changes to Move player.
- AC5: PASS — changes confined to Move controller/view, pure selector, tests and docs; no SQLite schema, migrations, keys or changes to unrelated features.
- AC6: PARTIAL — PR Quality run #40726291732 PASS (TS, existing regressions, targeted tests, Android Metro). Signed Android release on main PENDING after merge. Earlier run #40726087508 failed an obsolete structural assertion that required the old render-time SQLite import; updated guard preserves canonical tap validation.
- AC7: PASS — no measured performance improvement asserted; Android device profiling NOT RUN.

