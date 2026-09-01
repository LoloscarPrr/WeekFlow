# WF-CORE-002 — Formal TLC initialization

Status: DONE
Owner: WeekFlow

## Problem
`tlc-spec-driven` enforces spec-first implementation, but a new agent/session can still begin with stale or incomplete project context before writing the first spec. That creates a risk of using outdated roadmap state, version information, architecture assumptions, or old changelogs as current truth.

## Desired behavior
Before the first code change in a new working session, the agent performs a formal TLC initialization that reconstructs the current repository/product context and records a concise initialization snapshot before entering Think → Lock → Code → Verify.

## Scope
- Add an explicit Phase 0: Initialize to `tlc-spec-driven`.
- Define when initialization is required and when it may be reused.
- Define the minimum sources/checks required during initialization.
- Define a standard initialization snapshot format.
- Require repository-level agent instructions to run initialization before the first change of a working session.
- Add a reusable initialization template under `docs/specs/`.

## Non-goals
- No runtime WeekFlow behavior changes.
- No package/dependency changes.
- No automated CI enforcement in this spec.
- No requirement to rewrite the Blueprint.
- No requirement to persist every session snapshot as a committed file; the template defines the format and agents may report it in the task/PR context.

## Acceptance criteria
- [x] AC1 — `SKILL.md` defines Phase 0: Initialize before Think → Lock → Code → Verify.
- [x] AC2 — Initialization has explicit triggers for new agent/session, uncertain context, or materially changed `main`.
- [x] AC3 — Initialization requires reading agent instructions, the skill, current repository state, relevant product source-of-truth docs, active/relevant specs, and current version/build metadata where available.
- [x] AC4 — Initialization produces a standard snapshot containing repository/ref, app version/build, roadmap/product focus, active/relevant specs, baseline/check status, known constraints, and proposed next spec.
- [x] AC5 — Root `AGENTS.md` requires initialization before the first code change in a working session.
- [x] AC6 — A reusable initialization template exists at `docs/specs/_initialization.md`.
- [x] AC7 — No application runtime code or package dependencies are changed.

## Data / persistence impact
None.

## UI / UX impact
None.

## Edge cases / regressions
- If a source-of-truth document is unavailable, initialization must state that explicitly instead of guessing.
- If repository state changed materially after initialization (merge/rebase/version jump), initialization must be refreshed.
- Initialization should not become unnecessary ceremony before every tiny edit in the same unchanged working session.
- Historical changelogs may be read as evidence, but they must not override current Blueprint/product decisions/specs.

## Verification plan
- [x] Inspect final diff and confirm only workflow/documentation files changed.
- [x] Confirm all seven acceptance criteria against the committed files.
- [x] Confirm the lifecycle still preserves spec locking before implementation.

## Implementation notes
The initialization is a context gate, not a substitute for a feature spec. Its purpose is to establish trustworthy starting state before normal TLC work begins.

## Verification result
- AC1: PASS — Phase 0 is defined before Think/Lock/Code/Verify in `SKILL.md`.
- AC2: PASS — explicit session/context/main-change triggers are present.
- AC3: PASS — required repository, product, spec, version/build, and baseline reads/checks are defined.
- AC4: PASS — standard TLC Initialization Snapshot fields are defined in the skill.
- AC5: PASS — root `AGENTS.md` requires initialization before first code change.
- AC6: PASS — `docs/specs/_initialization.md` exists.
- AC7: PASS — compare against `main` shows only `.agents`, `AGENTS.md`, and `docs/specs` changes; no runtime/package files changed.
