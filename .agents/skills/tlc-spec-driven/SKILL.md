# tlc-spec-driven

## Purpose
Use specification-driven development for every WeekFlow product change. The spec is the source of truth; implementation is complete only when acceptance criteria are verified.

## Trigger
Apply this skill whenever work changes WeekFlow behavior, UX, data, architecture, integrations, build/release behavior, or fixes a bug.

## TLC loop
TLC = Think → Lock → Code.

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
- Compare the result against every acceptance criterion.

## Definition of Done
A change is Done only when:
1. The spec exists and is locked.
2. Every acceptance criterion is PASS or explicitly BLOCKED with evidence.
3. Persistence/migration impact was checked when relevant.
4. Known regressions and affected sibling screens were checked.
5. Documentation/changelog is updated when user-visible.
6. The PR references the spec ID and summarizes verification.

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

## Required PR footer
Include:

`Spec: WF-AREA-NNN`

and a checklist of acceptance criteria with PASS/BLOCKED status.
