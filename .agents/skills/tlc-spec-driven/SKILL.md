# tlc-spec-driven

## Purpose
Use specification-driven development for every WeekFlow product change. The spec is the source of truth; implementation is complete only when acceptance criteria are verified.

## Trigger
Apply this skill whenever work changes WeekFlow behavior, UX, data, architecture, integrations, build/release behavior, or fixes a bug.

## TLC workflow
TLC = Initialize → Think → Lock → Code → Verify.

### 0. Initialize
Run initialization before the first code change in a new working session when any of these are true:
- A new agent/session begins work on WeekFlow.
- Repository or product context is uncertain, stale, or incomplete.
- `main` changed materially since the last initialization (merge/rebase/version jump/roadmap change).
- The task crosses into a module or product area whose current state has not yet been inspected.

Initialization may be reused during the same working session while the relevant repository/product context remains unchanged. Do not repeat it mechanically before every tiny edit.

During initialization:
1. Read root `AGENTS.md` and this skill.
2. Confirm repository, current/base ref, and latest relevant repository state.
3. Read the current WeekFlow Blueprint Maestro and relevant repository product-decision docs when available.
4. Inspect active/relevant specs under `docs/specs/` and distinguish current specs from historical changelogs.
5. Inspect current app version/build metadata and relevant package/config metadata where available.
6. Identify the active roadmap/product focus and the source modules likely affected by the requested work.
7. Check available baseline status (tests/type/lint/build/CI) when practical; do not claim a baseline passed if it was not run or observable.
8. Record known constraints, unavailable sources, contradictions, or uncertainties instead of guessing.

Produce a concise **TLC Initialization Snapshot** before starting implementation work. It must contain:
- Repository and ref/base.
- Current app version/build when available.
- Current roadmap/product focus.
- Active/relevant specs.
- Baseline/check status (`PASS`, `FAIL`, `NOT RUN`, or `UNAVAILABLE`).
- Known constraints/uncertainties.
- Proposed next spec ID/title or the active spec being resumed.

Use `docs/specs/_initialization.md` as the canonical snapshot format.

Initialization is a context gate, not a feature spec. After initialization, continue with Think → Lock → Code → Verify.

### 1. Think
Before editing code:
- Identify the user problem and affected flows.
- Read the relevant blueprint/roadmap/product-decision docs and existing code.
- Check for cross-screen, persistence, keyboard, date/time, migration, and regression impact.
- Define non-goals to prevent scope creep.

### 2. Lock
Create or update a spec in `docs/specs/` before implementation.
A locked spec must contain:
- Spec ID and status.
- Problem statement.
- Desired behavior.
- Scope and non-goals.
- Acceptance criteria written as observable outcomes.
- Data/persistence impact.
- UI/UX impact.
- Edge cases and regressions to check.
- Verification plan.

Do not silently broaden a locked spec. If scope changes materially, update the spec first and record the change.

### 3. Code
Implement the smallest coherent change that satisfies the locked spec.
- Preserve current behavior outside scope.
- Prefer reusable fixes when the same defect exists across multiple screens/components.
- Add or update tests/checks where practical.
- Run available static checks/build checks.

### 4. Verify
Compare the implementation against every acceptance criterion.
- Record each criterion as `PASS` or `BLOCKED` with evidence.
- Check relevant sibling screens/components and regressions.
- Check persistence/migrations when relevant.
- Do not treat a successful build as proof that user-visible behavior is correct.

## Definition of Done
A change is Done only when:
1. Required initialization was completed or valid session initialization was reused.
2. The spec exists and is locked.
3. Every acceptance criterion is PASS or explicitly BLOCKED with evidence.
4. Persistence/migration impact was checked when relevant.
5. Known regressions and affected sibling screens were checked.
6. Documentation/changelog is updated when user-visible.
7. The PR references the spec ID and summarizes verification.

## Spec lifecycle
`DRAFT → LOCKED → IMPLEMENTING → VERIFYING → DONE`

Use `BLOCKED` only when an external dependency or unavailable capability prevents completion.

## WeekFlow conventions
- Spec IDs: `WF-<AREA>-NNN`, e.g. `WF-NOW-014`, `WF-FOOD-006`, `WF-CORE-003`.
- Product source of truth: current WeekFlow Blueprint Maestro and repository product-decision docs.
- Specs live in `docs/specs/`.
- One spec should describe one user-visible behavior or one tightly coupled technical change.
- Bug fixes require a regression criterion.
- A fix discovered on one screen must explicitly check whether the same shared pattern affects sibling screens.
- If a source of truth is unavailable or contradictory, state the uncertainty; do not silently invent or reconcile product intent.

## Required PR footer
Include:

`Spec: WF-AREA-NNN`

and a checklist of acceptance criteria with PASS/BLOCKED status.
