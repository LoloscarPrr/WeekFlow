# WF-CORE-007 — Gate de fase obligatorio en specs

Status: DONE
Owner: WeekFlow
Approved scope: Oscar · 06-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
WeekFlow ya tiene roadmap y reglas anti-feature-creep, pero el flujo TLC no obliga a declarar de forma explícita si una idea pertenece a la fase activa antes de bloquear una spec. Eso facilita que una buena idea termine compitiendo con el trabajo prioritario.

## Desired behavior
Toda nueva spec debe declarar su encaje de roadmap y una decisión de admisión. Solo las specs admitidas como trabajo actual pueden pasar a implementación; las demás quedan documentadas como backlog sin código.

## Roadmap fit
- Phase decision: NOW.
- Reason: refuerza directamente la disciplina de roadmap exigida por Blueprint v4.0 sin cambiar comportamiento de usuario.

## Scope
- Añadir el gate de fase al skill TLC del repositorio.
- Añadir campos equivalentes al template de specs.
- Mantener el resto del ciclo TLC intacto.

## Non-goals
- Reordenar el roadmap.
- Convertir ideas de Food/Rest/Brain/Insights en trabajo actual.
- Cambiar lógica de la app.

## Acceptance criteria
- [ ] AC1 — TLC exige declarar `Roadmap fit` y `Phase decision` antes de Code.
- [ ] AC2 — `BACKLOG` no puede pasar a implementación sin actualizar primero la spec.
- [ ] AC3 — El template de specs incluye ambos campos y una razón breve.
- [ ] AC4 — No cambia código de producto ni persistencia.

## Data / persistence impact
NONE.

## UI / UX impact
NONE.

## Verification plan
- Revisar diff del skill y template.
- Confirmar que no se tocaron módulos de producto.

## Verification result

- AC1: PASS — `.agents/skills/tlc-spec-driven/SKILL.md` exige Roadmap fit + `Phase decision: NOW | BACKLOG` antes de Code.
- AC2: PASS — el gate prohíbe llevar una spec BACKLOG a Code hasta actualizarla a NOW y volver a revisar/bloquear alcance y ACs.
- AC3: PASS — `docs/specs/_template.md` incluye decisión y razón.
- AC4: PASS — este cambio solo modifica documentación/proceso.

Quality #245: PASS — typecheck + regresiones completas.
