# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `cc401d4fcc909f2504ebb2d93ae976506dc8c5f9`.
- Working branch: `codex/wf-move-007-roadmap-exit`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0` (30-09-2026).

## App / build
- Technical app version: `0.4.6`; source Android `versionCode 88`; package `com.weekflow.app`.
- Main Quality #206: PASS.
- Main Android #155: PASS; signed APK/AAB generated and release published.
- Technical build numbering is independent from the v4.0 product-roadmap stages.

## Product context / active scope
- Blueprint v4.0 freezes classic OCR/Excel/PDF import work. Smart Import moves to 0.8.x as a multimodal Brain capability.
- Manual Semana remains canonical and permanently supported.
- Immediate roadmap focus is `0.2.x — Move completo` after the reliable Core/Semana gate.
- Move exit criterion: start an appropriate session for energy/time/equipment, complete it end-to-end, give feedback, and obtain coherent adaptation next time.

## Relevant Move state
- `WF-MOVE-001`: DONE — avoid areas.
- `WF-MOVE-003`: DONE — adaptive profile + real equipment/loads.
- `WF-MOVE-005`: DONE — manual exercise selection.
- `WF-MOVE-006`: DONE — structured real workouts.
- `WF-MOVE-002` and `WF-MOVE-004` remain historically marked LOCKED/PENDING even though their shipped behavior is present in current code and later changelogs/tests.
- Current Move runtime includes adaptive duration/intensity, 100+ exercise library, progression/regression from feedback, guided player, pause/rest/timers, exercise replacement, persistent history and final feedback.

## Baseline
- PASS — Quality #206 on current `main`.
- PASS — Android #155 on current `main`.
- PASS — `move-adaptation`, `move-library-progression` and `move-structured-workouts` are part of the Quality suite.
- PASS — current source shows profile, energy-derived recommendation, selectable available time, equipment/cargas, guided session and feedback persistence.
- Historical physical Move tests exist for the 0.3.22–0.3.25 work; final v4.0 roadmap closure still requires a concise acceptance pass against the new criterion.

## Next action / constraints
- Active spec: `WF-MOVE-007 — Cierre de Move 0.2.x`.
- Reconcile stale Move specs against current shipped behavior and executable regressions before adding any new Move feature.
- Do not expand the exercise library, add AI/voice, health diagnosis, periodized bodybuilding plans or unrelated UX.
- If the current implementation already satisfies the v4.0 exit criterion, close Move instead of creating feature creep and advance to Food.
