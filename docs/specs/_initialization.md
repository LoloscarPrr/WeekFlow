# TLC Initialization Snapshot — 2026-10-20 / WF-BRAIN-007

## Repository, ref and product
- Repo `LoloscarPrr/WeekFlow`, base `main` SHA `db90f4db3b9110875a04f565d6295e27e307abee`, branch `feat/wf-brain-007-state-questions`.
- Current product authority: WeekFlow Blueprint Maestro v4.0; milestone 0.7.x Assistant/Brain: common state, factual changes and answers on pillars. Smart Import deferred to 0.8.x.

## Version and tests
- Technical `0.5.15`, Android package `com.weekflow.app`; source versionCode 107 with monotonic CI versionCode.
- Quality #39483850236 PASS; Android signed APK/AAB #39483850178 PASS and release v0.5.15 published.
- Physical Android QA UNAVAILABLE (requires device to be tested by user).

## Active/relevant specs
- WF-BRAIN-001 foundation; WF-BRAIN-002 real state; WF-BRAIN-003 actions; WF-BRAIN-004 undo; WF-BRAIN-005/006 factual/relative exit.
- WF-BRAIN-007 (NOW): ask about Now/energy/Move/Food/Rest using common state.

## Inspected modules/constraints
- `src/assistant/context.ts`: pure `AssistantRealState` built from existing repositories and view controllers.
- `src/presentation/assistant/useAssistantController.ts`: reads state and confirms changes; no query path today.
- `src/assistant/interpret.ts`: cautious deterministic parser for action proposals, absolute and relative exits.
- `app/assistant.tsx`: single multiline text field and proposal card; UI should remain compact.
- Existing tests/structure and AGENTS/TLC skill read; baseline PASS via GitHub CI.
- No new SQLite, LLM, Smart Import, Move/Food/Rest schedule changes or automatic actions. Report QA physical not run.
