# WF-CORE-001 — Adopt spec-driven development

Status: DONE
Owner: WeekFlow

## Problem
WeekFlow changes have historically been implemented from conversational intent, changelogs, screenshots, and iterative fixes. That can leave sibling screens inconsistent, acceptance criteria implicit, and completed work difficult to verify against product intent.

## Desired behavior
WeekFlow development has one repository-local workflow that requires a written, testable spec before behavior changes and defines completion through acceptance criteria.

## Scope
- Add the `tlc-spec-driven` project skill.
- Add repository-level agent instructions.
- Add a reusable spec template and registry documentation.
- Require future behavior changes and bug fixes to reference a spec.

## Non-goals
- No runtime WeekFlow behavior changes.
- No package/dependency changes.
- No Blueprint content rewrite in this spec.
- No CI enforcement yet; that can be added as a separate spec.

## Acceptance criteria
- [x] AC1 — `.agents/skills/tlc-spec-driven/SKILL.md` exists and defines Think → Lock → Code plus Definition of Done.
- [x] AC2 — Root `AGENTS.md` requires use of the skill for repository changes.
- [x] AC3 — `docs/specs/_template.md` defines required sections and verification results.
- [x] AC4 — `docs/specs/README.md` defines lifecycle, naming, and area prefixes.
- [x] AC5 — Adoption does not change application runtime code or dependencies.

## Data / persistence impact
None.

## UI / UX impact
None.

## Edge cases / regressions
- Existing changelogs remain historical evidence and are not deleted.
- Existing runtime code remains untouched.
- Future bug fixes must include regression criteria and sibling-screen checks when applicable.

## Verification plan
- [x] Confirm all four workflow files exist on the feature branch.
- [x] Confirm only documentation/agent-instruction paths were added.
- [x] Confirm no app source or package files were modified.

## Implementation notes
The project-local skill is intentionally self-contained so development does not depend on an external marketplace plugin being available.

## Verification result
- AC1: PASS
- AC2: PASS
- AC3: PASS
- AC4: PASS
- AC5: PASS
