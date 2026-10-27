# WF-MOVE-010 — Unificar persistencia runtime de Move en SQLite canónico

Status: LOCKED
Owner: WeekFlow
Blueprint: WeekFlow Blueprint Maestro v4.0
Approved scope: optimization audit; minimal non-UI refactor · 2026-10-27

## Problem
`src/move/runtime.ts` opens `weekflow.db` independently and repeatedly executes DDL (`CREATE TABLE IF NOT EXISTS weekflow_state`) per storage operation. It duplicates the JSON parsing, key/value upsert and deletion already owned by `SQLiteStateStore`. The second persistence path complicates migrations and adds synchronous work to Move interactions.

## Desired behavior
Move runtime and feedback notes must use the singleton `sqliteStateStore` directly. Existing SQLite rows, logical keys and JSON record formats remain readable and writable without migrations or user intervention. All phase and note behaviors remain unchanged.

## Roadmap fit
- Phase decision: NOW
- Reason: stabilization of the currently active Move pillar and removal of duplicated database access without new features.

## Scope
- Update `src/move/runtime.ts` storage internals only, retaining exported function names/signatures and phase calculations.
- Add executable regression tests using a mocked canonical store to exercise reads, writes, legacy partial records, session mismatch, clearing runtime and bounded feedback note history.
- Run CI Quality, and signed Android APK/AAB release after merge if appropriate.

## Non-goals
- No new migrations, database version increment, renaming keys, moving tables, altering note history length/ordering or changing runtime session semantics.
- No UI or player timer changes, state-model changes, authorization/auth, remote sync, or package upgrades.
- No changes to separate WeekFlow-Pills repo or importing OCR/Excel.

## Acceptance criteria
- [ ] AC1 — Runtime reads/writes/deletes use only `sqliteStateStore`; no `openDatabaseSync` or per-operation CREATE TABLE remains in Move runtime module.
- [ ] AC2 — Existing keys `move-runtime-v1` and `move-feedback-notes-v1`, payload shapes and load/save/clear functions are unchanged.
- [ ] AC3 — Legacy partial runtime rows, mismatched session IDs, pause timing, feedback note replacement/trimming and 30-note limit behave identically.
- [ ] AC4 — Canonical schema migration can read existing `weekflow_state` rows without reset; unrelated state remains untouched.
- [ ] AC5 — Full Quality passes on PR and is verified against tests with mocked storage; Android signed build passes on main or is documented as blocked.
- [ ] AC6 — No other Move screens, product behavior or native release signing change.

## Data / persistence impact
No schema or version migration. `SQLiteStateStore` opens the same `weekflow.db`, and uses the same `weekflow_state` SQL column names and upsert behavior as the removed local adapter. Reads and deletes use the existing rows in place. Keys are not renamed; dates/JSON contents are not rewritten during load.

## UI / UX impact
None. Training playback, pause/resume, exercise substitution, feedback and notes remain visually and behaviorally identical.

## Edge cases / regressions
- Prior standalone runtime table with PRAGMA user_version 0: canonical migration uses `CREATE TABLE IF NOT EXISTS`, retaining records.
- Partial/invalid JSON still handled by the canonical read returning null.
- Cleared runtime must not delete active Move session, completed history, preferences or notes.
- Feedback notes are still deduplicated by sessionId, newest first, max 30.
- Unrelated saved preferences/Brain planner/Rest state untouched.
- No cross-module transaction semantics change for session vs runtime writes (still independent).

## Verification plan
- [ ] Source-level verification of keys and same singleton.
- [ ] Executable mock-store regression test: legacy load, create/save/clear, session mismatch, pause clock, note replacement, limit, preserved unrelated rows.
- [ ] `npm run quality` in PR.
- [ ] Signed Android workflow on main after merge.
- [ ] Manual device upgrade with existing Move session/feedback records marked NOT RUN where unavailable.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
