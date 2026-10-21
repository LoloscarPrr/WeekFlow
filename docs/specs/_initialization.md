# TLC Initialization Snapshot — WF-BRAIN-009 (2026-10-21)

## Repository / ref
- `LoloscarPrr/WeekFlow`, base main `c48f5a5a86e893156241edf9d9af61bbc6b92833`, branch `feat/wf-brain-009-explain-real-exit`.
- Fuente de producto: WeekFlow Blueprint Maestro v4.0, §14 y roadmap canónico 0.7.x Assistant/Brain antes de 0.8.x Smart Import.

## Baseline / versión
- Version técnica 0.5.17, source Android versionCode 109, package `com.weekflow.app`; build firmado main #39547050464 PASS, Quality #39547050501 PASS, release APK/AAB 0.5.17 publicada. QA física sin certificar.
- Versión previa de Brain registra estados, horarios, salidas reales/relativas, comida y contesta preguntas desde estado real, con undo.

## Active specs
- WF-BRAIN-001 foundation, WF-BRAIN-004 undo, WF-BRAIN-005/006 salidas real/relativa, WF-BRAIN-007 preguntas, WF-BRAIN-008 Food (última).
- Next: WF-BRAIN-009 «Explicar el impacto de salida real», decisión NOW según Blueprint.

## Source reviewed
- `src/brain/exitImpact.ts`: cálculo HH:MM y regla de flexibles; fecha ausente si jornada de tarde cruza medianoche.
- `src/application/useCases/registerActualExit.ts`: registro/corrección canónica.
- `src/application/useCases/getNowView.ts`: deriva `shiftContext.endAt`, `exitImpact`, `needsExitReview` y plan.
- `src/presentation/now/useNowController.ts`: usa mismo caso de uso.
- `src/presentation/assistant/useAssistantController.ts`: tarjeta confirmable, acción Brain y undo.
- `src/brain/engine.ts`: replanAfterActualExit protege lo fijo y puede dejar flexible pendiente.
- `tests/regression.test.ts`, `tests/brain-actions.test.ts`, tests estructurales Assistant.

## Constraints
- El usuario pidió no instalar/probar cada versión; mantener CI/Quality y builds, QA real por lotes.
- Sin esquema SQLite, dependencia nueva, lógica Move/Rest/Food o Smart Import. Proyecto Pills intocable.
- Sin certeza de hora de llegada: únicamente estimación calculada con commuteBackMin.
