# WF-CORE-003 — Adaptive multiple-layout shell

Status: DONE
Owner: WeekFlow

## Problem
The current application shell is optimized around a single phone width. Main screens commonly use fixed horizontal padding and the bottom navigation expands across the available width. On compact phones this leaves little room for dense controls; on tablets and large displays content stretches unnecessarily and loses hierarchy.

## Desired behavior
WeekFlow exposes one shared responsive layout policy with three observable classes — compact phone, regular phone and wide/large screen — so all routed screens inherit sensible content width and navigation sizing without duplicating product logic.

## Scope
- In scope:
  - Add a reusable adaptive-layout classifier based on current window width.
  - Constrain the routed screen stage on wide displays while preserving full-width behavior on phones.
  - Reduce outer shell pressure on compact phones.
  - Constrain and resize bottom navigation per layout class.
  - Preserve keyboard-hide behavior and all existing routes/actions.
- Affected screens/modules:
  - `app/_layout.tsx`
  - `src/components/BottomNav.tsx`
  - `src/presentation/layout/useAdaptiveLayout.ts`

## Non-goals
- No redesign of individual cards, copy, feature flows or domain logic.
- No persistence/database changes.
- No landscape-only navigation rail in this increment.
- No change to the canonical five-zone navigation model.

## Acceptance criteria
- [x] AC1 — Widths below 360 dp are classified as compact, 360–839 dp as regular, and 840 dp or above as wide.
- [x] AC2 — On regular phones, routed screens retain the current full-width behavior and bottom navigation remains functionally unchanged.
- [x] AC3 — On wide displays, routed content is centered and capped at a readable maximum width rather than stretching edge to edge.
- [x] AC4 — Bottom navigation is centered and capped on wide displays; compact screens use reduced horizontal shell spacing without clipping any of the five destinations by construction.
- [x] AC5 — Keyboard visibility continues to hide the bottom navigation, and route activation rules remain unchanged.
- [x] AC6 — No data, scheduling, Brain, Food, Move, Rest, Week or Now behavior changes as a side effect.

## Data / persistence impact
None.

## UI / UX impact
A shared responsive shell changes only outer width/alignment and navigation spacing. Existing visual identity, copy, cards and route semantics remain unchanged.

## Edge cases / regressions
- Width crossing a breakpoint updates through `useWindowDimensions` without remounting product state.
- Software keyboard behavior is preserved: BottomNav still returns `null` while visible.
- Sibling routes inherit the same routed stage: Ahora, Semana, Pilares, Jardín, Asistente, Food, Rest, Move, Import and guided flows.

## Verification plan
- [x] Inspect TypeScript imports/types for the new shared hook.
- [x] Verify the shell uses the shared classifier rather than duplicated breakpoint constants.
- [x] Verify route tree and BottomNav active-path logic are unchanged.
- [x] Verify no persistence/domain files are modified.
- [ ] Physical/device rendering at compact, regular and wide sizes — BLOCKED: no emulator/device renderer available in this tool session.
- [x] Acceptance criteria recorded as PASS/BLOCKED.

## Implementation notes
The implementation intentionally keeps this increment presentation-only. Wide layouts center a readable application stage (`1040dp` max) and navigation (`720dp` max). Compact layouts reduce BottomNav shell/padding and label/icon sizing. A tablet-specific navigation rail remains a future decision that should be justified by device testing rather than introduced speculatively.

## Verification result
- AC1: PASS — `classifyAdaptiveLayout` uses shared 359/840 breakpoints.
- AC2: PASS — regular class applies no stage max width and no compact BottomNav overrides.
- AC3: PASS — `app/_layout.tsx` centers `screenStage` and applies `maxWidth` only for wide layouts.
- AC4: PASS by code inspection — BottomNav is centered, has `width: 100%`, receives `maxWidth: 720` on wide, and compact metrics reduce spacing while retaining five equal-flex items.
- AC5: PASS — keyboard listeners/early return and active-route conditions are unchanged.
- AC6: PASS — changed implementation files are presentation shell/navigation only; no domain, application, data or persistence files changed.

## Verification limitations
- Local clone/type/build execution: BLOCKED because the shell runtime could not resolve `github.com`; no false PASS recorded.
- GitHub PR workflow runs: UNAVAILABLE at verification time; the PR head reported no associated workflow runs.
- Physical compact/regular/wide rendering: BLOCKED until tested on device/emulator.
