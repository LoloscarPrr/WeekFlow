# TLC Initialization Snapshot — WF-MOVE-010 (2026-10-27)

## Repository/ref, version and baseline
- Repository: `LoloscarPrr/WeekFlow`, base `main` `d9dd0d0e4b1560624b043bfe79903a917bad8c2b`; working branch `perf/wf-move-010-canonical-runtime-store`.
- Version: WeekFlow Alpha `0.5.28`; Expo ~57.0.8 / RN 0.86.0 / React 19.2.3; Android package `com.weekflow.app`, source versionCode 114; release build assigns monotonic run-specific code.
- CI `main`: Quality #40483763841 PASS, signed Android APK/AAB #40483763887 PASS. Physical Android SQLite upgrade/runtime test: NOT RUN.
- Blueprint Maestro v4.0 + recent product focus: canonical state, reliable Android releases, Move as independent weekly planning pillar (0.5.28), no rewriting confirmed plans.

## Technical context
- `src/data/local/sqlite/SQLiteStateStore.ts` is the canonical singleton for key/value state in `weekflow.db`; `read/write/delete` run migration version 1 and use consistent INSERT/ON CONFLICT semantics.
- `src/move/runtime.ts` separately opens `weekflow.db`, repeats `CREATE TABLE IF NOT EXISTS weekflow_state` on every read/write/delete, and duplicates JSON parsing/upserts.
- Move keys already persisted on devices: `move-runtime-v1` and `move-feedback-notes-v1`; must be preserved byte-for-byte, alongside history, active session and preferences in `src/state/persistence.ts`.
- APIs used by `src/move/useMoveController.ts`: load/save/clear runtime, save notes, calculate elapsed phase.
- No schema migration, version bump, data reset, UI change or alterations to time/feedback logic allowed.
- Reviewed `AGENTS.md`, TLC skill, relevant Move 001-009 specs and `WF-CORE-008`; the import and release architecture must remain stable.

## Decision
- NOW: `WF-MOVE-010` — route runtime and feedback note storage through the canonical SQLiteStateStore with injectable/testable contract at build-time only; preserve existing semantics.
- BACKLOG: Move timer/UI profiling, SQLite async conversion, retention/schema changes, cross-module atomic writes and other audit tasks.
- Remaining uncertainty: an instrumented Android upgrade test with preexisting user records cannot be executed from GitHub CI; include explicit manual QA recommendation.
