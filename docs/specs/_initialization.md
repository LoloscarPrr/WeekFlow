# TLC Initialization Snapshot — WF-MOVE-015 (2026-11-10)

## Repository/ref
- `LoloscarPrr/WeekFlow` main `ddcc426fd32079c205a9f24a0ab5646c5b071473`, working branch `feature/wf-move-015-rest-preview`.
- Current main technical display version: 0.5.35; working branch synchronizes next release to 0.5.36 (`package.json`, `package-lock.json`, `app.json`, version regression); Android package `com.weekflow.app`, `versionCode` 114 in `app.json`, Expo SDK 57.
- Product blueprint: WeekFlow Blueprint Maestro v4.0 (2026-09-30). Technical version is distinct from product roadmap phase. Preserve current visual identity and local-first state.

## Product phase and relevant sources
- Product phase focus: Core stability and Move end-to-end guided workouts. The blueprint prioritizes Move before adding unrelated modules, with no obligatory OCR work.
- Inspected `AGENTS.md`, `.agents/skills/tlc-spec-driven/SKILL.md`, blueprint v4.0, `docs/specs/WF-MOVE-011-timer-cadence.md`, `docs/specs/WF-MOVE-013-classic-exercise-priority.md`, `src/move/MovePlayer.tsx`, `src/move/useMoveController.ts`, `src/move/library.ts`, `src/move/runtime.ts`, `src/move/styles.ts`, and existing Move tests.
- `WF-NOTIFY-007` already protects native alarms when rescheduling. Actual 24–48h physical Android delivery remains BLOCKED on user-device testing, not solved by this Move change.
- `WF-MOVE-014` remains reserved for genuine offline exercise illustrations. This spec does not claim to add illustrated assets.

## Baseline/check status
- Repository main signed Android #42109242897: PASS on 2026-11-05 (pre-change), observed in GitHub Actions.
- Full Quality for current branch: NOT RUN before changes; CI will be checked on the PR.
- Physical Android guided-session and long-idle notification tests: UNAVAILABLE in this environment.

## Constraints and decision
- No changes to SQLite, session progression, timers, resume/pause, feedback, planning, notifications, Android signing, or previously saved data.
- Keep Move useful on small phones and during late-night/low-energy sessions; all cues are derived from existing exercise catalog rather than fabricated guidance.
- NEXT: `WF-MOVE-015 — Próximo ejercicio claro durante el descanso`, Phase decision NOW. Scope: read-only preview of the next workout step while resting.
