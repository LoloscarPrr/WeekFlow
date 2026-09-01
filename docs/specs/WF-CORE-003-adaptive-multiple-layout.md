# WF-CORE-003 — Adaptive multiple-layout shell

Status: LOCKED
Owner: WeekFlow

## Problem
The current application shell is optimized around a single phone width. Main screens commonly use fixed horizontal padding and the bottom navigation expands across the available width. On compact phones this leaves little room for dense controls; on tablets and large displays content stretches unnecessarily and loses hierarchy.

## Desired behavior
WeekFlow must expose one shared responsive layout policy with three observable classes — compact phone, regular phone and wide/large screen — so all routed screens inherit sensible content width and navigation sizing without duplicating product logic.

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
  - new shared responsive layout utility under `src/presentation/layout/`

## Non-goals
- No redesign of individual cards, copy, feature flows or domain logic.
- No persistence/database changes.
- No landscape-only navigation rail in this increment.
- No change to the canonical five-zone navigation model.

## Acceptance criteria
- [ ] AC1 — Widths below 360 dp are classified as compact, 360–839 dp as regular, and 840 dp or above as wide.
- [ ] AC2 — On regular phones, routed screens retain the current full-width behavior and bottom navigation remains functionally unchanged.
- [ ] AC3 — On wide displays, routed content is centered and capped at a readable maximum width rather than stretching edge to edge.
- [ ] AC4 — Bottom navigation is centered and capped on wide displays; compact screens use reduced horizontal shell spacing without clipping any of the five destinations.
- [ ] AC5 — Keyboard visibility continues to hide the bottom navigation, and route activation rules remain unchanged.
- [ ] AC6 — No data, scheduling, Brain, Food, Move, Rest, Week or Now behavior changes as a side effect.

## Data / persistence impact
None.

## UI / UX impact
A shared responsive shell changes only outer width/alignment and navigation spacing. Existing visual identity, copy, cards and route semantics remain unchanged.

## Edge cases / regressions
- Case: width crosses a breakpoint during resize; layout must update from `useWindowDimensions` without remounting product state.
- Case: software keyboard visible; navigation remains hidden as before.
- Sibling screens/components to verify: Ahora, Semana, Pilares, Jardín, Asistente, Food, Rest, Move, Import, guided Food/Move flows.

## Verification plan
- [ ] Inspect TypeScript imports/types for the new shared hook.
- [ ] Verify the shell uses the shared classifier rather than duplicated breakpoint constants.
- [ ] Verify route tree and BottomNav active-path logic are unchanged.
- [ ] Verify no persistence/domain files are modified.
- [ ] Physical/device rendering at compact, regular and wide sizes; BLOCKED if no renderer/device is available.
- [ ] Acceptance criteria recorded as PASS/BLOCKED.

## Implementation notes
Use a small presentation-only hook. The wide layout intentionally centers a readable application stage rather than introducing a new navigation paradigm; a navigation rail can be a later spec if real tablet testing justifies it.

## Verification result
Fill only during VERIFYING/DONE.

- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
