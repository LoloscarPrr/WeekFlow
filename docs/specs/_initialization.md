# TLC Initialization Snapshot

## Repository and ref
- Repository: `LoloscarPrr/WeekFlow`.
- Base: `main` at `de0a8f894f5700761443b184e5914cada218b306`.
- Working branch: `codex/wf-food-004-repeat-aware`.
- Product source of truth: `WeekFlow Blueprint Maestro v4.0` (30-09-2026).

## App / build
- Technical app version: `0.4.6`; source Android `versionCode 88`; package `com.weekflow.app`.
- Main Quality #208: PASS after Move 0.2.x closure.
- Android #155: PASS and still current because the Move closure changed only documentation outside Android workflow paths.

## Product context / active scope
- Move 0.2.x is closed under `WF-MOVE-007`.
- Current roadmap focus is `0.3.x — Food completo`.
- Smart Import remains frozen until 0.8.x and is out of scope.
- Existing Food already covers pantry, viable recipes, shopping, guided cooking, photo review and prep/reuse.

## Food audit
- `WF-FOOD-001`: DONE — pantry, viable recipes, shopping, guided recipe and correctable history.
- `WF-FOOD-002`: DONE — camera/gallery pantry proposal with explicit review.
- `WF-FOOD-003`: DONE — prepared portions and ingredient reuse.
- Shared keyboard-aware scroll is integrated in Food; Quality includes Food/global keyboard structure regressions.
- `food-history` persists up to 14 daily records.
- Gap found against Blueprint v4.0: `rankFoodRecipes()` does not currently use recent Food history, so the same recipe can stay at the top repeatedly despite the product requirement to avoid repetition.

## Baseline
- PASS — main Quality #208.
- PASS — Android #155 on unchanged runtime baseline.
- PASS — `food-core` and `food-photo-prep` current regression suites.
- PASS — shared keyboard visibility/focus regression suite.
- FAIL (product gate) — recipe ranking is history-blind; recent consumption has zero effect on recommendation order.

## Next action / constraints
- Active spec: `WF-FOOD-004 — Recomendaciones sin repetición mecánica`.
- Use the existing 14-day local history; do not create a new table or tracking system.
- Recent repetition should reduce ranking priority, never hide a viable recipe or shame the user.
- Manual entries must not create accidental recipe penalties unless they correspond to a known non-manual recipe consumption.
- Preserve pantry coverage, context, time, budget, low-energy behavior, guided cooking, shopping and prep.
- Publish the behavior as technical 0.4.7 / source versionCode 89 if verification passes.
