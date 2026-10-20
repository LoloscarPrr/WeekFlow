# TLC Initialization Snapshot — 2026-10-20

## Repository / ref
- LoloscarPrr/WeekFlow, `main` SHA `b4f76e5844db458b936d652d89aae391dc2e4321`.
- Branch: `feat/wf-brain-005-actual-exit`.
- Canonical product: WeekFlow Blueprint Maestro v4.0, 0.7.x Assistant + Brain (real changes, replan flexible) before 0.8.x Smart Import.

## Version and known baseline
- 0.5.13, Android source versionCode 105, package com.weekflow.app.
- Quality #39366393404: PASS; Android signed APK/AAB #39366393378: PASS.
- Physical device testing not available from GitHub CI (NOT RUN).
- Current Brain specs WF-BRAIN-001 through WF-BRAIN-004; 0.7.4 undo merged and verified via CI, physical test pending.
- New spec WF-BRAIN-005 (NOW): real departure from Assistant via canonical Ahora flow.

## Source inspected
- `src/assistant/interpret.ts`: currently handles energy and scheduled `salgo` only.
- `src/brain/actions.ts`: typed proposal, receipt, safe undo.
- `src/presentation/assistant/useAssistantController.ts`: confirms and saves DayState / WeekSchedule and refreshes notifications.
- `src/presentation/now/useNowController.ts`, `src/application/useCases/registerActualExit.ts`, `src/application/useCases/getNowView.ts`: canonical actual exit + shift-context + replan guard.
- `src/brain/exitImpact.ts`: requires confirmation to move flexible moments after significant timing differences.

## Constraints
- Build from GitHub connector and CI; no mobile device QA.
- Keep Week schedule, fixed commitments, Move minimum 30 min, onboarding, notification safety, and 0-redundancy UX intact.
- Text interpretation must not confuse planned `salgo` and factual `salí`; only active shifts, always explicit confirmation; no Smart Import or generic assistant LLM.

## Active task
- WF-BRAIN-005 — register actual exit with clear, safe language and reused Now/Brain, tests and Android signed validation.
