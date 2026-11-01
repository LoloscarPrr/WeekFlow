# TLC Initialization Snapshot — WF-WEEK-014 (2026-11-01)

## Repository/ref and build
- Repository `LoloscarPrr/WeekFlow`; `main` at `587df2cd3180664d407c97d18c81f10cf3b72b31` (WeekFlow v0.5.33), branch `feat/wf-week-014-two-week-rotation`.
- Quality #41317575119 PASS, signed Android build #41317575150 PASS for baseline; physical Android QA NOT RUN.
- Android ID `com.weekflow.app`, permanent signing and auto-versionCode preserved; next product release `0.5.34` to prevent replacing v0.5.33 release assets.
- Blueprint Maestro v4.0 reviewed: canonical manual seven-day shifts, dates/overnight consistency across Ahora/Semana/Rest/notifications; single Brain truth, no silent data reset.

## Current state and impact
- Canonical legacy SQLite key `week-state` holds one seven-day schedule; `useWeekController` edits it directly.
- Week UI shows seven days with work/off, start/end/break, moments, ritual; `WeeklyPlannerPreview` can choose this/next week but always uses same `week`.
- `confirmWeeklyProposal` recalculates with `loadWeekState()` for both weeks; Assistant weekly intent also plans next week from current schedule.
- `shiftContextForDate` checks previous day for overnight carry. At Monday rollover this Sunday must still come from the previous anchored week.
- `nextWorkingShift` can cross Monday while retaining the current seven-day schedule (Rest).
- Legacy schedules / dated important moments / confirmed plans / scheduled notifications must not be silently deleted.
- Current Sunday 2026-11-01; Monday 2026-11-02 is the first upcoming boundary.

## Phase decision
- NOW: WF-WEEK-014 — current and next-week independent shifts, safe Monday promotion, date-correct Brain planning and refresh, preserve dated moments and overnight carries.
- BACKLOG: keeping >2-week history, calendar sync, automatic forecast beyond the two-week horizon, imported schedule targeting next week.

## Constraints
- Preserve `week-state` as current canonical key to keep older imports and consumers; add versioned sidecar key for anchoring and next week.
- Never copy current week into next silently. Offer explicit Copy current -> next. If next was never prepared, new Monday has empty/unorganized week rather than falsely recurring shifts.
- Plan confirmation must revalidate against the intended dated schedule.
- No change to WeekFlow-Pills.
