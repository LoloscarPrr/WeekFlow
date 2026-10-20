# TLC Initialization Snapshot — WF-BRAIN-007 (2026-10-20)

## Repository and ref
- Repository `LoloscarPrr/WeekFlow`, base `main` at `db90f4db3b9110875a04f565d6295e27e307abee`.
- Branch `feat/wf-brain-007-real-state-questions`.
- Canonical product: uploaded `WeekFlow Blueprint Maestro v4.0`, phase 0.7.x Assistant + Brain, including answers from same real state; Smart Import remains 0.8.x.

## App/version and baseline
- `package.json` / `app.json`: 0.5.15, package `com.weekflow.app`, source versionCode 107 (CI monotonic).
- Quality run #39483850236 PASS; Android build #39483850178 PASS, 0.5.15 signed APK/AAB published.
- Physical installation/visual QA UNAVAILABLE from current tooling.
- Previous WF-BRAIN-006 code verification passes and CI release passes, spec VERIFYING pending physical QA.

## Relevant specifications and code
- WF-BRAIN-001–WF-BRAIN-006; last one adds relative real exit.
- `src/assistant/context.ts`: read-only builder of canonical Now/Move/Food/Rest/energy fields.
- `src/presentation/assistant/useAssistantController.ts`: reads `DayState`, `WeekSchedule`, Move/Food history, Now/Rest views; handles confirmed Brain action and safe undo.
- `src/assistant/interpret.ts`: current explicit, safe action recognition; must remain unaffected.
- `app/assistant.tsx`: existing short message area, text input and proposal controls.
- Tests: assistant-conversation, assistant-context, assistant-conversation-structure; Quality gate enforced.

## Active work and constraints
- WF-BRAIN-007 (NOW): read-only questions about real state; avoid new state/persistence and speculative answers.
- Do not touch Smart Import, Move 30-minute minimum, signing, notifications behavior or any data migration.
- PR Quality and post-merge Android required before APK is offered.
