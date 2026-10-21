# TLC Initialization Snapshot — WF-BRAIN-008 (2026-10-21)

## Repository and ref
- `LoloscarPrr/WeekFlow`, base `main` `b6bfec109c98cd431ecea3ccef52f46b75d0e8ec`, branch `feat/wf-brain-008-food-logging`.
- Blueprint Maestro v4.0: Food tiene registro manual, rápido y corregible; Brain/Asistente debe compartir estado real, confirmar y poder deshacer.

## Version and baseline
- App version 0.5.16, package `com.weekflow.app`, Android source versionCode 108. Quality main #39500865071 PASS; signed Android #39500865001 PASS and published 0.5.16.
- Physical QA of earlier versions not certified; supplied screenshot reproduced actual unsupported intent.

## Relevant specs/code
- WF-BRAIN-001 Brain Action Foundation, WF-BRAIN-003 confirmable text, WF-BRAIN-004 undo, WF-BRAIN-007 factual read-only questions.
- `src/assistant/interpret.ts`: only energy and shift/real-exit intents.
- `src/brain/actions.ts`: shared action/receipts, only DayState/WeekState today.
- `src/presentation/assistant/useAssistantController.ts`: canonical state and confirmation/undo.
- `src/food/history.ts`, `src/state/persistence.ts`, `app/food.tsx`: existing manual FoodEntry with `kind:'other'`, `source:'manual'`, `saveFoodEntry`, `removeFoodEntry`, refresh on focus.
- Relevant regression suites for Brain, Food and Assistant.

## Constraints/plan
- Feature WF-BRAIN-008 (NOW) limited to confirmable manual food entry from explicit past-tense text; preserve all existing logic and storage.
- No calories or quantities inferred, no Smart Import, no change to Move min 30, signatures or WeekFlow Pills.
- PR CI required before merge; physical Android UX cannot be verified from remote build.
