# WeekFlow 0.5.11

## Brain 0.7.3 — Primeras acciones conversacionales

- Asistente acepta texto para cambios simples de energía y turno.
- Frases de energía generan propuestas `set-energy`.
- “mañana/lunes… entro/salgo a las HH:MM” genera propuestas `update-week-shift`.
- Ningún cambio se aplica sin confirmación.
- Confirmar usa Brain Action Foundation y persiste solo el estado canónico afectado.
- Cancelar o una frase no reconocida no modifica datos.
- Después de aplicar se refresca Estado real y se resincronizan recordatorios.
- Sin LLM, voz ni Smart Import todavía.

Spec: `WF-BRAIN-003`
