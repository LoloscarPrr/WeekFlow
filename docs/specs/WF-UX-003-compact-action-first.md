# WF-UX-003 — Acción primero, formularios cuando hagan falta

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
Move's routine action is buried behind preferences and a full exercise preview. Semana duplicates week selectors, always displays event creation inputs, and exposes a long weekly-planner form. Ahora uses oversized energy tiles. The result feels like a form rather than a life-planning assistant, and requires avoidable scrolling on small Android screens.

## Desired behavior
A person opening the app can understand today's priority, edit a shift or start a guided workout immediately. Secondary settings, detailed preview and creation forms open on explicit taps. Existing values, safeguards and critical confirmation paths stay intact.

## Roadmap fit
- Phase decision: NOW
- Reason: directly reduces cognitive load and improves usable Core/Semana/Move; no new modules, Smart Import or feature expansion.

## Scope
- Move: put duration and start near the first card; collapse routine tuning, physical-profile editor and full exercise preview under visible toggles. Show compact current choices. Keep disabled-state explanation visible if no eligible exercise.
- Semana: one canonical week selector; weekly planner follows selected week without a redundant local selector. Start with concise planner summary, reveal session settings on demand and always show pending-confirmation warning. Events list is always visible; creation fields expand on demand.
- Ahora: shorten vertical spacing and energy-button height without shrinking tap targets under 44 px.
- Food: streamline empty meal log, shorten shortcut/context panels and preserve recipe/ingredient actions.
- Rest: remove duplicated pillar heading and make recovery cards denser without changing sleep guidance.
- Add structure/regression checks in Quality.

## Non-goals
- No functional removals, state migration, rewriting Brain logic, notification workflow, fitness/safety rules, session state, Firebase, native build or app navigation.
- No hidden mandatory action or change to approval/cancel semantics.
- No advertising of measured battery/performance gains from visual spacing changes.

## Acceptance criteria
- [x] AC1 — Move's duration controls and start CTA are reachable before optional settings and preview; profile, session targets/styles and library remain available.
- [x] AC2 — Move shows a compact summary of current focus/targets/style. Invalid target prevents starting and shows a visible explanation and path to settings.
- [x] AC3 — Weekly planner uses `selectedWeek` as the sole week selector, warns if existing confirmed plan needs review and never confirms without showing the proposal.
- [x] AC4 — Important moments remain listed even when event creation is folded; tapping the creation trigger reveals the original date/time/name controls.
- [x] AC5 — Now retains four energy choices, actual exit/replan and upcoming timeline, with compact touch targets (>=44 px).
- [x] AC6 — No data-schema, session logic, notification, date, signing or navigation changes; only technical display version increments to 0.5.37 via established release gates.
- [x] AC8 — Food and Rest keep their registered meal/rest flows with less empty-state repetition and denser cards.
- [x] AC7 — Targeted regressions and complete Quality/Metro pass; Android physical QA/build status reported accurately.

## Data/persistence impact
None. All UI expand/collapse state is local and ephemeral; existing state sources and saved schedules/history are unchanged. Release display metadata moves from 0.5.36 to 0.5.37; Android versionCode continues to be assigned by the signed build workflow.

## UI/UX impact
Primary action above optional forms, folded details by default, one source of truth for selected week, concise actionable summaries and tap targets >=44 px.

## Edge cases/regressions
- Prepared confirmed Move slot, completed training today, no compatible exercises, screen reentry during active session.
- Week switching, unprepared next week, stale confirmed plan warning, proposal displayed and explicit confirmation.
- Important moments with zero/one/many entries, keyboard date/time selection, after saving.
- Energy refresh, actual-exit time correction, night shifts and bottom navigation.
- Small Android/keyboard and touch QA BLOCKED until tested physically.

## Verification plan
- Source structural guards for rendering/visibility and unchanged actions.
- Full `npm run quality`, Metro export via PR CI, Android release after merge if safe.
- Physical Android scroll/keyboard/tap validation marked BLOCKED without device.

## Verification result
## Verification result — 2026-11-15
- AC1: PASS — Move source order has action above secondary settings; full preview and profile are explicitly expandable, with no session engine changes.
- AC2: PASS — selected focus, muscles, and routine style show in the compact summary; unsupported targets keep the start disabled with visible warning. Regression guard included in Quality.
- AC3: PASS — `selectedWeek` owns the planner week; obsolete nested selector removed. The full proposal and explicit save/confirmation remain intact; the old two-roster test was updated to enforce the single source.
- AC4: PASS — event creation is folded by default while records remain listed; save closes form; deletion and date/time controls are unchanged.
- AC5: PASS by code check — 60px energy choices, actual exit confirmation and live timeline retained. Physical Android: BLOCKED/NOT RUN.
- AC6: PASS by diff/CI — no SQLite or planning/session/notification/native key changes; display version 0.5.37 and existing Android version regression checks pass.
- AC7: PASS PR Quality #43730631495 (TypeScript, full regression suite, Android Metro export). Signed release build: PENDING after merge. Real-device small-screen/keyboard QA: BLOCKED until device testing.
- AC8: PASS by code/CI — Food meal log action replaces empty boilerplate; quick links and context remain; Rest retains nap, timeline and recovery schedule with reduced repeated headings.
- Earlier CI attempts revealed two old structural tests coupled to redundant UI wording/state. Tests were updated to assert the new single-week selection while keeping safety/weekly setting paths. Final PR Quality PASS.
- No measured battery/CPU performance claims; this release targets visual density and interaction efficiency, not engine changes.
