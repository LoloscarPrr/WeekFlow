# WF-MOVE-013 — Priorizar ejercicios clásicos en Move sin eliminar regresiones

Status: VERIFYING
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
Move's exercise catalog has standard push-ups, but the generic and targeted chest selection order favors wall press, toe taps, gentle reaches and standing scapular retractions. Even a regular strength workout with available floor and enough intensity can omit basic push-ups entirely. A user with dumbbells sees several load-based options but no standard push-up in the first four previews.

## Desired behavior
In moderate/high, non-mobility bodyweight workouts, prefer recognizable compound exercises: squats, push-ups (regular when experience allows, knee version otherwise), lunges and planks. During chest-targeted workouts, include a compatible standard/knee push-up in the first visible group even when registered dumbbells remain prioritized. Do not impose floor or other equipment; show why pushups are not shown when floor is disabled.

## Roadmap fit
Phase decision: NOW — address concrete usability problem reported from actual Android workouts, preserve v0.5.33 equipment-aware behavior.

## Scope
- Change ordering only in `src/move/library.ts` for moderate/high `fuerza` / `equilibrado` sessions and chest-targeted routines.
- Keep squat first in general force rotation for stable progression and treat loaded exercises as preferred when the profile specifies weights, while including an eligible classic push-up by the first few chest candidates.
- Provide explicit, brief guidance in `MovePlan` for why push-ups may be unavailable until the user enables floor work.
- Add deterministic tests for intermediate/beginner/recovery, missing floor, avoid-wrist/shoulder, no equipment, loaded chest and excluded exercises.
- Visual illustrations for selected exercises: separate WF-MOVE-014, not fake diagrams here.

## Non-goals
- No global changes to experience gates, intensity thresholds, AI training logic, persisted data, time, notification, training style, schedule, templates or Android signing.
- No harder exercises forced on novices, exhausted days, injuries, or users who cannot use floor; never automatically enable floor.
- No new catalogue IDs required; all existing saved session IDs and progression families remain intact.
- No changes to WeekFlow Pills.

## Acceptance criteria
- [x] AC1 — When floor is enabled and intermediate/advanced profile in a moderate/high strength or balanced session, classic push-up is prioritized over wall press in eligible bodyweight selection.
- [x] AC2 — Beginners or unspecified experience get compatible knee push-ups when floor enabled; gentle intensity/recovery remain safe and allowed by current gating.
- [x] AC3 — In chest targeting with weights, prefer registered weights but reserve a visible slot for a compatible push-up within the first four; no phantom equipment.
- [x] AC4 — With floor disabled or excluded exercise/avoid area, no forbidden exercise is selected; users see an explanation for the floor gate.
- [x] AC5 — Existing squat, progression, muscle splits, sets/AMRAP, intensity and feedback safety remain working; avoid dominating normal workouts with rehab-like moves.
- [x] AC6 — No persistence/UI layout/schema/signing changes outside the small explanatory copy.
- [ ] AC7 — Targeted regressions + full Quality/Metro pass in PR; signed Android build after merge is verified or explicitly blocked.
- [x] AC8 — Offline visual exercise guides not claimed shipped; future phase WF-MOVE-014.

## Data / persistence impact
None; work uses existing public exercise IDs, user preferences and Move history. Profile values stay untouched.

## UX impact
More recognizable strength/balanced routine previews and short text explaining that push-ups require the explicitly-enabled floor option.

## Edge cases
- For energy `agotado` -> recovery, keep low-load exercises, never force push-up.
- Wrist/shoulder/lowerBack avoided and floor disabled must filter.
- Strength with registered dumbbells should still include weights (including biceps) and not return phantom weights.
- Target chest with novice/undefined experience uses knee push-up; intermediate uses normal push-up.
- Manual exclusions and previous feedback progression remain respected.

## Verification plan
- [ ] Pure TypeScript tests for recommended sequences and selection restrictions.
- [ ] Existing Move, Brain, Garden and history regression suite + Android Metro bundle.
- [ ] Signed standalone Android build from main after merge.
- [ ] On-device confirmation of requested training example; NOT RUN without physical-device access.

## Verification results
- AC1: PASS — intermediate moderate bodyweight force/balanced previews include `pushup`; bodyweight force now uses classic structured sets when owned loads are absent, preserving training duration and original set semantics.
- AC2: PASS — beginners or undefined experience use eligible `knee-pushup`; recovery does not force push-ups; the current experience gate on standard `pushup` is not loosened.
- AC3: PASS — chest-focused eligible options reserve a classic push-up within the first four including registered dumbbell profiles; weight-based presses remain first. Explicit no-feedback classic preservation avoids auto-replacing chosen push-ups with equivalent loaded presses.
- AC4: PASS — floor disabled, blocked wrists, excluded IDs and no-phantom-equipment regression cases pass; `MovePlan` describes how to opt into floor work.
- AC5: PASS — existing Move adaptation and progression, structured workouts, Brain/Now/Garden tests and all other regression tests PASS in Quality #41317308605.
- AC6: PASS (source inspection) — no SQLite, migrations, history keys, native signing, app version or stored preferences changed.
- AC7: PARTIAL — PR Quality #41317308605 PASS (TypeScript, full regression suite, Android Metro export). Earlier two PR checks failed newly added assertions that revealed the missing bodyweight series and later loaded-press re-selection; both were repaired. Signed Android APK/AAB on main: PENDING after merge.
- AC8: PASS — offline visual technique diagrams explicitly BACKLOG under WF-MOVE-014, not included or claimed shipped.
- Real-device workout and equipment QA: NOT RUN, should be checked on Android before claiming visual UX outcome.

