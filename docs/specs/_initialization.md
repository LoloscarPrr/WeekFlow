# TLC Initialization Snapshot

## Repository
- Repository: `LoloscarPrr/WeekFlow`.
- Base ref: remote `main` at `b1412dabed17aeae1b77629d39035fb6a384eba4`.
- Working ref/branch: `codex/wf-food-002-photo-prep-reuse`.

## App / build state
- Source version: `0.4.0`; Android source `versionCode`: `82`.
- Package: `com.weekflow.app`.
- Main Quality baseline: PASS — run #181 for Food 0.4.0 implementation.
- Native Android release baseline: PASS — run #149; signed 0.4.0 APK + AAB published.
- WF-FOOD-001: DONE.

## Product context
- Current Blueprint Maestro v3.3 defines 0.4.x Food complete as: recipes, “qué tienes”, shopping, meal prep, budget, substitutions and logging, with a viable meal end-to-end.
- Its Food exit criteria explicitly require “¿Qué tienes disponible?” to accept text and photo, and require shopping, advance preparation and ingredient reuse to reduce effort/waste.
- Current main already provides text pantry, shopping, budget/time/cooking preferences, 12 guided recipes and correctable logging.
- The user explicitly approved proceeding with the photo + meal-prep/reuse layer now.

## Specs
- `WF-FOOD-001`: DONE.
- New active specs:
  - `WF-FOOD-002 — Foto de despensa revisable`.
  - `WF-FOOD-003 — Preparación anticipada y reutilización`.

## Relevant implementation surface
- Food main screen: `app/food.tsx`.
- Food library/shopping: `app/food-library.tsx`, `app/food-shopping.tsx`.
- Guided cooking: `src/food/FoodGuidedRecipe.tsx`.
- Pantry model: `src/food/pantry.ts`.
- Recipe catalog/ranking: `src/food/recipes.ts`, `src/food/recommendations.ts`.
- Persistence: `src/state/persistence.ts`.
- Existing camera/gallery + on-device OCR reference: `src/components/ScheduleImportCard.tsx`.
- Existing native dependencies already include `expo-image-picker` and `@infinitered/react-native-mlkit-text-recognition`.

## Baseline
- TypeScript + regression suite: PASS via Quality #181.
- Native Android release: PASS via Android #149.
- Physical Food 0.4.0 flow: NOT RUN in this coding session.

## Constraints / uncertainties
- Photo input must feed the same canonical FoodPantry; no second pantry truth.
- No pantry change is saved until explicit review/confirmation.
- Current installed ML Kit OCR can reliably read visible package/label text but is not a fresh-produce object detector. WF-FOOD-002 therefore proposes from visible text and lets the user complete missing visual items manually rather than pretending certainty.
- Photos are processed locally and are not persisted/uploaded by this flow.
- Do not add an unproven native vision dependency that risks Android release stability.
- Meal prep must not invent expiry/shelf-life or food-safety guarantees.
- Prepared portions require explicit creation and consumption actions.
- Preserve offline-first behavior, existing Food history, shopping and guided cooking.

## Next TLC action
- Lock WF-FOOD-002 and WF-FOOD-003 before changing behavior.
- Implement local photo review into FoodPantry.
- Implement prepared portions and shared-ingredient reuse suggestions.
- Add regression tests, bump to 0.4.1, run PR Quality, merge, then verify signed Android APK + AAB.

> Rule: physical-device and camera recognition quality remain field-validation items; CI can verify logic/build, not real-world camera accuracy.
