# WF-MOVE-015 — Próximo ejercicio claro durante el descanso

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
Durante una sesión guiada, la fase de descanso enseña únicamente el nombre del siguiente ejercicio. No anticipa sus instrucciones, el material necesario ni las repeticiones de una serie o la composición de un circuito. El usuario debe esperar a que termine el descanso antes de prepararse; al cambiar automáticamente de paso pierde tiempo y claridad.

## Desired behavior
Mientras la sesión esté en descanso, ofrecer una vista previa compacta y fiel del siguiente paso del plan confirmado: título, una indicación de técnica existente en el catálogo, material registrado cuando corresponda y prescripción de la siguiente serie/circuito. El descanso y todos los controles siguen funcionando igual.

## Roadmap fit
- Phase decision: NOW
- Reason: mejora concreta y acotada de la ejecución de Move, pilar que el Blueprint v4.0 pide cerrar de punta a punta. No abre otro módulo.
- Genuine illustrated exercise assets remain separate `WF-MOVE-014` backlog, without invented diagrams.

## Scope
- Introduce a pure next-step read-model `src/move/nextStepPreview.ts` from the existing routine, preferences and stored step overrides.
- Render that preview exclusively during the rest phase in `src/move/MovePlayer.tsx`, with compact reusable styles.
- Add deterministic Move unit/structure regression checks to existing Quality.
- Bump only the synchronized display version metadata to 0.5.36 as the next standalone release; retain the existing Android workflow's monotonic versionCode and signing.

## Non-goals
- No images or animations misrepresented as true technique diagrams.
- No changes to intensity, step selection, automatic progression, timer, rest length, skip, feedback, equipment eligibility, learning engine, or weekly scheduling.
- No SQLite keys/schema/migration, notifications, SDK, signing, package IDs, or unrelated module work.

## Acceptance criteria
- [ ] AC1 — During rest, the player reveals the *next* step's title and existing exercise instruction, not the current or repeated final step.
- [ ] AC2 — Series preview shows the upcoming set number and reps; timed steps show the upcoming phase duration; AMRAP shows next round and actual circuit items/reps.
- [ ] AC3 — A saved exercise override for the next step is respected in the preview and stored preferences determine the shown equipment label; the preview does not mutate the workout or state.
- [ ] AC4 — Final/no-next-step cases never invent another exercise, throw or interfere with `Saltar descanso`, `Pausar`, `Continuar`, and completion.
- [ ] AC5 — Existing UI on a small Android screen remains scrollable/readable, keeping primary controls accessible without additional navigation or permissions.
- [ ] AC6 — Relevant Move regression tests, TypeScript/Quality/Metro Android checks and physical Android QA reported accurately as PASS or BLOCKED.
- [ ] AC7 — Display version metadata and version regression assertion agree on 0.5.36; package name, signing and monotonic Android versionCode workflow remain unchanged.

## Data / persistence impact
None. Read-only derived view from `routine.steps`, `preferences` and `runtime.exerciseOverrides`. Existing canonical SQLite session and feedback keys are unchanged.

## UI / UX impact
Rest card gains a short `A CONTINUACIÓN` panel with title, preparation cue and optionally equipment or rep breakdown; optional circuit lines remain within the existing scroll. Single screen, no new mandatory action.

## Edge cases / regressions
- No next step; steps array empty/invalid index; final step.
- Adjacent sets of the same movement with different set numbers/repetitions.
- Next AMRAP round (including its actual circuit), not current round.
- User replaced a future exercise using saved override.
- None/default equipment and registered loads.
- Player remains scrollable; not alter active/paused state or skip rest action.
- Sibling MoveHome, MovePlan, MoveFeedback and Now agenda are untouched.

## Verification plan
- [ ] Pure TypeScript test of preview from exercise/series/AMRAP/overrides/final cases.
- [ ] Structural integration guard for MovePlayer, with no step mutations.
- [ ] Full Quality and Metro build on PR.
- [ ] Manual 30-minute session on Android, including small screen, long names, pause/skip; BLOCKED when no phone access.

## Verification result — 2026-11-10
- AC1: PASS by source inspection: preview derives the actual `currentStepIndex + 1`, renders catalog title/cue, and returns null if missing.
- AC2: PASS by source inspection and added TypeScript regression cases: set number/reps, timed duration, and next AMRAP round/circuit.
- AC3: PASS by source inspection and regression cases: next-step overrides and preferences are consumed read-only; no SQLite key/schema changes.
- AC4: PASS by source inspection and regression cases: final, empty, invalid index return null; existing pause/skip/complete callbacks unchanged.
- AC5: PASS for scroll/layout source inspection; physical small-phone check BLOCKED until Android device QA.
- AC6: Initial PR Quality #42919451125 PASS (TypeScript, regression suite, Metro bundle) before version synchronization; final PR Quality and signed Android release PENDING. Full on-device walkthrough BLOCKED by unavailable physical device. No claim of verified Android UX until device testing.
- AC7: PENDING synchronized release metadata and regression verification.
