# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`.
- Base ref: remote `main` at `fb4382f07f72e6ec75e9945907aa450756a0027b`.
- Working ref/branch: `codex/wf-food-001-pantry-viable-recipes`.

## App / build state
- Source version: `0.3.27`; Android source `versionCode`: `81`.
- Package: `com.weekflow.app`.
- Latest main Quality: PASS — run #179.
- Latest native Android release build: PASS — run #148; APK + AAB published.

## Product context
- Current Blueprint Maestro: v3.3.
- Roadmap gate for Move is functionally satisfied in current main; the next committed product focus is `0.4.x · Food completo`.
- Food exit intent: help execute a viable meal end-to-end with recipes, available ingredients, substitutions, shopping/prep support, context-aware proposals and correctable logging.
- Existing Food already has shift/energy suggestions, 4 guided recipes, manual “Comí otra cosa”, 14-day local history and time correction.
- The user explicitly approved proceeding with Food now.

## Specs
- No existing `WF-FOOD-*` spec exists in main.
- Relevant completed work: `WF-MOVE-006`, `WF-NOTIFY-002`.
- Proposed active spec: `WF-FOOD-001 — Despensa, recetas viables y compras`.

## Relevant implementation surface
- Main Food screen: `app/food.tsx`.
- Guided cooking: `src/food/FoodGuidedRecipe.tsx`.
- Recipe data: `src/food/recipes.ts`.
- Context suggestions: `src/food/suggestions.ts`.
- Food history: `src/food/history.ts`.
- Persistence facade / SQLite state store: `src/state/persistence.ts`.
- Navigation: `src/components/BottomNav.tsx`.

## Baseline
- TypeScript + regression suite: PASS via Quality #179.
- Native Android release build: PASS via Android #148.
- Physical Food pantry/purchase flow: NOT RUN because it does not exist yet.

## Constraints / uncertainties
- Preserve current Food logging/history behavior and guided recipe completion.
- Remain offline-first; no account/cloud dependency.
- Do not introduce calories into the MVP.
- Do not infer allergies/medical diets or make health diagnoses.
- Pantry/photo recognition is not yet implemented. WF-FOOD-001 will establish the text/persistence/ranking core first; photo input must later feed the same model rather than create a second Food truth.
- Budget is a user preference/context signal, not a precise price promise.
- Do not silently mark missing ingredients as owned.
- Keep keyboard-safe Android behavior.

## Next TLC action
- Lock `WF-FOOD-001`, implement pantry text + viable recipe ranking + shopping list + preferences + persistence + regression coverage, then verify Quality and signed Android release.

> Rule: do not turn physical-device checks into PASS without device evidence.
