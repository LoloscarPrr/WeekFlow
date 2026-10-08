# WeekFlow 0.5.9

## Brain 0.7.1 — Action Foundation

- Nuevo contrato `BrainActionProposal` para representar cambios reales de forma estructurada.
- Toda propuesta incluye título, explicación, payload, fecha y si requiere confirmación.
- Nuevo ejecutor puro `applyBrainAction`.
- Acciones de referencia:
  - cambiar energía del día;
  - actualizar un turno semanal.
- Las acciones reutilizan los use cases existentes de Ahora y Semana.
- Una acción confirmable no se aplica sin confirmación explícita.
- Cada aplicación produce un `BrainActionReceipt` con estado anterior/posterior.
- Nuevo `undoBrainAction` con protección contra conflictos: no pisa cambios posteriores.
- El foundation no escribe SQLite ni crea estado paralelo del Asistente.

## Compatibilidad

- Sin migraciones ni nuevas claves de persistencia.
- No cambia la UI de Ahora, Semana o Asistente.
- No agrega todavía chat, voz ni interpretación de lenguaje natural.
- Smart Import permanece fuera de alcance hasta 0.8.x.

Spec: `WF-BRAIN-001`
