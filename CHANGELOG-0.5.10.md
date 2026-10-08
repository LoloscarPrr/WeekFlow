# WeekFlow 0.5.10

## Brain 0.7.2 — Asistente conectado al estado real

- Asistente ahora construye un contexto vivo desde las fuentes canónicas de WeekFlow.
- Reutiliza `getNowView` para contexto Ahora y `getRestView` para Rest.
- Muestra energía actual, jornada, estado vivo, Move de hoy, Food de hoy y contexto Rest.
- El contexto se refresca cada vez que Asistente recupera el foco.
- No crea un store paralelo ni agrega persistencia.
- Los accesos existentes de Asistente se conservan.

## Compatibilidad

- Sin migraciones SQLite.
- Sin cambios destructivos en Ahora, Semana, Move, Food o Rest.
- No agrega todavía chat, voz ni interpretación de lenguaje natural.

Spec: `WF-BRAIN-002`
