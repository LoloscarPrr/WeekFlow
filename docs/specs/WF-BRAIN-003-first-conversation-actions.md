# WF-BRAIN-003 — Primeras acciones conversacionales

Status: LOCKED
Owner: WeekFlow
Approved scope: Oscar · 09-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
El Asistente ya conoce el estado real y Brain ya tiene acciones confirmables, pero el usuario todavía no puede expresar un cambio en lenguaje natural y convertirlo en una propuesta real.

## Desired behavior
El Asistente acepta texto libre acotado y reconoce de forma determinista dos familias de cambios:
- energía actual;
- entrada/salida de un turno por día.

Cuando reconoce una frase, genera una `BrainActionProposal` explicable. No aplica nada hasta que el usuario confirme. Si no entiende con suficiente certeza, no inventa.

## Roadmap fit
- Phase decision: NOW
- Reason: 0.7.3 debe demostrar que conversar con WeekFlow puede producir cambios reales usando el estado común y el contrato de 0.7.1.

## Scope
- Input de texto en Asistente.
- Intérprete determinista local para energía.
- Intérprete determinista local para “entro/salgo” con hoy/mañana o día de semana.
- Preview de propuesta con explicación.
- Confirmar / cancelar.
- Aplicar mediante `applyBrainAction`.
- Persistir el resultado en DayState o WeekSchedule canónicos.
- Refrescar contexto después de aplicar.
- Respuesta explícita cuando no se reconoce la frase.
- Cerrar WF-BRAIN-002 con evidencia Android #169.

## Non-goals
- LLM/IA remota.
- Voz.
- Preguntas abiertas.
- Reorganización multi-módulo.
- Interpretar eventos importantes.
- “No alcanzo a entrenar” todavía.
- Undo visible; queda para 0.7.4.
- Smart Import.

## Acceptance criteria
- [ ] AC1 — “hoy estoy cansado/agotado/bien/con energía” genera propuesta `set-energy`.
- [ ] AC2 — “mañana entro/salgo a las HH[:MM]” genera propuesta `update-week-shift` sobre el día correcto.
- [ ] AC3 — día de semana explícito (“lunes”, etc.) se resuelve a 0–6.
- [ ] AC4 — horas inválidas o frases ambiguas no generan propuesta.
- [ ] AC5 — ninguna propuesta se aplica sin confirmación.
- [ ] AC6 — confirmar usa `applyBrainAction` y guarda solo el target canónico afectado.
- [ ] AC7 — cancelar descarta la propuesta sin cambiar persistencia.
- [ ] AC8 — tras aplicar, el contexto del Asistente se refresca.
- [ ] AC9 — input y propuesta son usables con teclado móvil y no eliminan controles existentes.
- [ ] AC10 — Quality y Android release pasan antes de DONE.

## Data / persistence impact
Sin schema nuevo. Solo escribe DayState/WeekSchedule existentes después de confirmación.

## UI / UX impact
Nueva sección “CUÉNTAME QUÉ CAMBIÓ” sobre Estado real. Input multiline breve, botón Interpretar, preview de propuesta y botones Confirmar/Cancelar.

## Edge cases / regressions
- 9 / 09 / 9:30 / 09:30.
- “mañana” al cruzar domingo→lunes.
- tildes y mayúsculas.
- “estoy cansado” no debe confundirse con turno.
- hora fuera de 00:00–23:59.
- frase no soportada no debe tocar datos.

## Verification plan
- Tests puros del parser.
- Tests de controller/aplicación.
- Test estructural de UI y confirmación.
- Quality PR.
- Merge solo en verde.
- Android firmado post-merge.
