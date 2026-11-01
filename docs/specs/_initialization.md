# TLC Initialization Snapshot — WF-MOVE-013 (2026-11-01)

## Repository and baseline
- Repo `LoloscarPrr/WeekFlow`, main `a72d0d93dc5afbfc59edb7ff22d3414ba841bbed` (WeekFlow 0.5.33), branch `feat/wf-move-013-classic-exercises`.
- Android app ID / keystore / versionCode rules unchanged. Main Quality #40905240647 PASS, signed Android #40905240505 PASS. On-device tests NOT RUN.
- 133 distinct exercises already exist. Classic `pushup` is present but minExperience=intermedio, minIntensity=moderada and floor-required; chest and generic focus priority start from wall press / soft movement. Default `floorAllowed=false`, `experience=sin_definir`, `goal=bienestar`.

## Sources and constraints
- Blueprint Maestro v4.0; root AGENTS.md; .agents/skills/tlc-spec-driven/SKILL.md; latest v0.5.33 catalogue/equipment changes and WF-MOVE-009/010/011/012.
- `src/move/library.ts`: FOCUS_ORDER, orderedIds, compatibleTargetedExercises, exercise progression, preset series and AMRAP.
- `src/move/muscles.ts`: chest starts wall-press, incline-push, knee-pushup before standard pushup. `targetedSeriesRoutine` takes first four exercises per target combination.
- `src/move/adaptation.ts`: energy and feedback determine intensity; no false assumption of equipment/floor; user can declare floor availability, experience, goal and affected areas.
- `src/move/MovePlan.tsx`: can explicitly enable floor and shows four preview exercises; a missing floor availability currently makes classic pushups ineligible.
- `src/move/exerciseCatalog.ts`: standard pushup and knee pushup have required safety cue; no new exercise data needed.
- Existing workout & progression tests require a squat lead for force, weight preference for registered equipment, no excluded/incompatible items and lighter recovery paths.

## Phase decision
- NOW: WF-MOVE-013 — select recognizable classic bodyweight movements for normal/moderate workouts; keep gentle variants for genuine low energy, restrictions or beginner regressions.
- BACKLOG: independent illustrated technique guide assets with quality-controlled offline exercise frames (WF-MOVE-014), additional exercises not needed for this specific bug.

## Verification status
- Baseline Quality PASS, Android signed PASS (on main); new branch checks NOT RUN. Device exercise-selection QA and illustrations NOT RUN.
