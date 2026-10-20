# TLC Initialization Snapshot — WF-BRAIN-006 (2026-10-20)

## Repository and ref
- `LoloscarPrr/WeekFlow` main `1973e40f202b392fa7417a4164f24dbfe9f0c5de`; working branch `feat/wf-brain-006-relative-actual-exit`.
- Product intent: WeekFlow Blueprint Maestro v4.0; roadmap 0.7.x Brain + Assistant, before 0.8 Smart Import.

## Version / baseline
- Technical version 0.5.14; Android package `com.weekflow.app`, source versionCode 106, monotonic CI.
- Quality #39391269511: PASS.
- Android #39391269580: PASS, signed v0.5.14 APK/AAB published (release); physical QA unavailable.

## Active specifications
- WF-BRAIN-001 foundation; WF-BRAIN-003 natural-language change; WF-BRAIN-004 undo; WF-BRAIN-005 absolute actual exit.
- WF-BRAIN-006 (NOW): support Blueprint literal «salí una hora tarde» by deriving from dated shift end. No new pillar/Smart Import.

## Relevant current code
- `src/assistant/interpret.ts`: absolute «salí a las 22:30» and planned «mañana salgo» distinct.
- `src/presentation/assistant/useAssistantController.ts`: gets canonical NowView, shiftContext, confirmed proposal and notification sync.
- `src/brain/actions.ts`: current shift guard, use case `correctActualExitTime`, undo receipt.
- `src/domain/services/shiftSchedule.ts`: shiftContext.endAt already dated for overnight.
- Tests in assistant-conversation, brain-actions and structure.

## Constraints / QA
- Cannot physically install APK; CI/build only, and QA in device remains unverified.
- No changes to SQLite schema, Move min 30, Week, or signing.
- Use TLC Lock → Code → Verify and remote CI before merge.
