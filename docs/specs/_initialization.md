# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `ca5a85e87ca830a23f2cc88f0830d1ec85fba917`.
- Working branch: `ux/wf-ux-002-compact-move-min30`.
- Product source of truth: uploaded `WeekFlow Blueprint Maestro v4.0` (read sections 1–3, Core, Ahora, Move, governance) and current user's UX feedback.

## App / build
- App version: `0.5.12`; Android source `versionCode 104`, package `com.weekflow.app`.
- Quality at initialization: NOT RUN; first candidate test suite passed up to smart-silence; its legacy copy assertion was fixed in subsequent commit; final CI pending.
- Android at this branch: NOT RUN at initialization.
- Last available baseline from repository docs was for earlier versions; not evidence for this branch.

## Product context / active scope
- Current canonical roadmap stage in repository: 0.7.x — Assistant + Brain, with UX corrections to already shipped areas admitted NOW.
- Immediate fixes: Move 30-minute minimum, removal of shorter action, and cross-screen reduction of redundant text.
- Brain, SQLite, notification logic and exercise generator remain the single underlying sources of truth.

## Relevant repository state
- `app/index.tsx` repeats “AHORA”/“Qué importa ahora”/“DÍA VIVO” and repeats summary stats.
- `src/move/useMoveController.ts` exposes 5/10/20/30 min; `adaptation.ts` recommends 5/10/20/30 and supports shorter duration.
- `src/move/MovePlan.tsx` offers shortening and explanatory copy.
- `app/rest.tsx` exposes a persistent internal “REGLAS ACTIVAS” panel.
- Assistant and other pillar pages contain long technical/descriptive microcopy.

## Baseline / constraints
- PASS — current source and supplied Blueprint inspected; AGENTS/TLC read.
- NOT RUN — typecheck, JS tests, Android build for new branch.
- Constraint — direct local GitHub clone is unavailable in this runtime; use GitHub connector and remote CI.
- Constraint — physical Android QA is needed to mark UX visually verified.
- Existing active Move sessions under 30 min must not change while in progress.

## Locked change specs
- `WF-UX-002 — Una sola vez, en el lugar correcto` (NOW).
- `WF-MOVE-009 — Move sin versiones inferiores a 30 minutos` (NOW).
