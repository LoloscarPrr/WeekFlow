# WeekFlow Specs

This directory is the execution layer between the WeekFlow Blueprint Maestro and code.

## Workflow
Every behavior change follows the project skill at `.agents/skills/tlc-spec-driven/SKILL.md`:

`Think → Lock → Code → Verify`

Specs progress through:

`DRAFT → LOCKED → IMPLEMENTING → VERIFYING → DONE`

## Naming
Use `WF-<AREA>-NNN-short-title.md`.

Common areas:
- `CORE` — architecture, persistence, shared UI, migrations.
- `NOW` — Ahora.
- `WEEK` — Semana/import/ritual.
- `BRAIN` — assistant and planning intelligence.
- `MOVE` — activity/training.
- `FOOD` — meals/recipes/logging.
- `REST` — sleep/recovery.
- `HABIT` — habits/Jardín.
- `ONBOARD` — onboarding.
- `NOTIFY` — notifications.
- `RELEASE` — packaging/distribution/release reliability.

## Rule
A changelog is evidence of what shipped; a spec defines what should be built and how completion is verified. Do not use old changelogs as substitutes for active specs.
