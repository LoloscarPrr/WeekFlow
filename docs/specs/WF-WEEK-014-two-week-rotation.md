# WF-WEEK-014 — Dos horarios semanales y rotación automática los lunes

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Phase decision: NOW — user-reported contradiction between current and next week in Brain planning.

## Problem
WeekFlow has one seven-day schedule in `week-state`, shared by both "Esta semana" and "Próxima semana" previews. This makes a future plan use the wrong shifts. On Monday the user must edit/reorganize despite already knowing the upcoming roster.

## Desired behavior
- Semana exposes explicit tabs "Esta semana" and "Próxima semana", each with a dated Monday–Sunday range.
- All shifts and break lengths for next week are edited and saved separately from current week. Optional "Copiar horario actual" fills the next week only after user action.
- On Monday at local time, if next week was prepared, promote it atomically by logical window to the current schedule; preserve important moments and existing user data. No prompt/ritual necessary to reactivate that prepared schedule. Next slot becomes editable empty week.
- If no next schedule was prepared, do not pretend last week's shifts repeat: show a clear unorganized empty week.
- Brain preview and confirmation, including Assistant, use the schedule for the selected target Monday, not the week's old seven rows.
- Important moments remain date-bound and visible after rollover; Sunday overnight carry can continue into Monday.

## Scope
- New pure date/week-window utility and versioned SQLite metadata sidecar. Preserve current key `week-state`.
- Expose load/save week offset, read by target date, and use the same canonical resolver in Brain weekly planning and confirmation.
- Week controller/UI with two tabs, editing, copy button, date label, focus refresh, separate ritual state; important moments remain current/global.
- Keep Now local-week refresh and ensure Sunday overnight carry works across week boundary.
- Signed Android release v0.5.34 and regression tests.

## Non-goals
- No imports, external calendar, >2-week future storage, new AI planning decisions, habit/Move schema changes, rescheduling confirmed commitments without confirmation or silent carry-forward of stale unprepared roster.
- Do not delete old weekly plan or Move/habit histories. Do not alter keystore or app ID.

## Acceptance criteria
- [x] AC1 — Current and next week edits remain isolated; next starts empty unless saved/copied and preserves correct break/work/off.
- [x] AC2 — At local Monday, prepared next becomes current without manual repeat; following next is blank. Unprepared week never invents carry-forward shifts.
- [x] AC3 — Legacy `week-state` migrates additively and is not erased on first load; dated important moments survive promotion. Rollover idempotent even if offline across several weeks.
- [x] AC4 — Brain "Esta semana"/"Próxima semana" preview and confirmation, and Assistant weekly proposal, use correct target shifts and reject stale previews.
- [x] AC5 — Weekly summaries, events and per-week ritual accurately display selected week; returning to Semana after crossing Monday refreshes tab/context.
- [x] AC6 — Now on Monday uses new current shifts, retains prior Sunday overnight carry; avoid stale repeated schedule in reminders and Rest where practical.
- [x] AC7 — No data resets, unrelated app regressions, app ID or keystore changes; proper new release tag not reusing 0.5.33.
- [ ] AC8 — Added deterministic tests for Sun→Mon, two-week independent edits, legacy, stale/empty next and overnight; Quality/Metro and signed Android build pass or are explicitly BLOCKED.
- [ ] AC9 — Device upgrade/rollover QA marked NOT RUN unless instrumented.

## Data impact
`week-state` remains current WeekSchedule; additive `week-window-v1` metadata stores current Monday, optional next prepared week, optional previous week for overnight rest. No migration/reset of other keys. Dated moments stay in canonical `week-state`.

## UX
Two tabs above summary and days, range label, small empty-next explanatory copy, explicit copy action, and only current moment editor; Brain's own planning tabs remain selected as before.

## Risks
Crossed midnight on Monday, DST date keys, on-screen refresh while open over boundary, interrupted promotion writes, stale plan confirmation after schedule edits, preserved week-state imports, and future habits/reminders.

## Verification plan
Pure week-window tests; integration structural guards; existing 0.5.33 suite; Android Metro export; signed release; manual test for actual on-device data and alarms.

## Verification results
- AC1: PASS — independent current `week-state` and dated next `week-window-v1` roster, separate tab edits, off/work and break data preserved. User copy is explicit; no speculative automatic repetition.
- AC2: PASS (pure test) — on local Monday the prepared roster is promoted with `organizedAt` automatically set; following next slot becomes empty. Unprepared or stale two-week-old next roster never generates work shifts.
- AC3: PASS (pure and structural) — legacy `week-state` stays canonical; promotion uses atomic SQLite `writeBatch`, preserves date-keyed moments and retains prior Sunday for carry. Day-1 rollover/idempotence/absence tests PASS. Physical upgrade NOT RUN.
- AC4: PASS (source/integration tests) — Brain and Assistant use `loadWeekStateForOffset` with previous Sunday. Confirmation re-checks target week's canonical shifts and prior Sunday; separate current/next confirmation keys and stale `workScheduleSignature` checks. Old unverified future confirmation is retained but must be explicitly reconfirmed.
- AC5: PASS (structure/source) — tabs, date range, copy option, dated events and tab-specific summary/ritual rendered; Week refocus and once-minute Monday detection refresh UI.
- AC6: PASS (pure/source) — Now and Rest refresh on Monday, previous Sunday night carry uses preserved week; next shift and live notifications use selected dated roster and exclude dates beyond prepared two-week horizon.
- AC7: PASS (static) — no changes to app ID or keystore, version bumped to 0.5.34 including lockfile; no history reset or unrelated SQLite migration.
- AC8: PASS Quality #41322251552 on prior production head (TS/full regressions/Metro) and earlier #41322180087, #41322126349. Latest additional legacy invalidation and documentary commits require fresh Quality. Signed Android release not yet run.
- AC9: BLOCKED: no physical Android device access; user must check upgrade with current week and next-week edits, rollover and notification schedule.

