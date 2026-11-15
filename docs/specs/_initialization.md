# TLC Initialization Snapshot — WF-UX-003 (2026-11-15)

## Repository and ref
- Repository `LoloscarPrr/WeekFlow`; main/base `02468af5f21f26c062a26f474482490a143dc63c` (WeekFlow 0.5.36).
- Working branch `feature/wf-ux-003-compact-action-first`.
- Expo SDK 57, Android `com.weekflow.app`, signed release workflow preserves monotonic versionCode and permanent key; no native edits planned.

## Product priority and source of truth
- WeekFlow Blueprint Maestro v4.0: reduce mental load rather than add features; Ahora displays one priority, Semana remains compact and manually editable, Move closes its guided experience, UI/keyboard must remain usable on small phones; advanced planning requires explicit confirmation.
- Read root `AGENTS.md` and `.agents/skills/tlc-spec-driven/SKILL.md`, relevant UX and Week/Move specs, current `app/index.tsx`, `app/week.tsx`, `src/components/WeeklyPlannerPreview.tsx`, `src/components/ImportantEventCard.tsx`, `src/move/MovePlan.tsx` and `src/move/styles.ts`.
- Current two open PRs #75 and #110 are historical branches; no open competing PR on the current 0.5.36 files at initialization. Avoid writes to main until review/CI.

## Baseline and constraints
- 0.5.36 release and main Quality #42920129152 both PASS (historical); new branch Quality NOT RUN.
- Physical Android visual/keyboard QA: UNAVAILABLE in this tool environment.
- No backend, scheduling, data migration, persistence, notification, identity, signing or exercise engine edits. No changes to the Brain proposal confirmation semantics.
- Feature scope: action-first condensed Move, single-week selector and on-demand event/planner in Semana, denser energy controls in Ahora; small-screen touch targets must remain operable.

## Next locked spec
- `WF-UX-003 — Acción primero, formularios cuando hagan falta`, Phase decision NOW because it directly addresses excessive visible form controls and repetitious content in existing modules.