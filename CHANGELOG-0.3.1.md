# WeekFlow Alpha 0.3.1

## Move feedback hardening

- El feedback pendiente de una sesión terminada hoy vuelve a aparecer al reabrir Move.
- El usuario puede omitir el feedback de forma explícita; WeekFlow no insiste ni lo convierte en obligación.
- Una sesión terminada antes, sin feedback posterior, reduce de forma conservadora la siguiente duración recomendada.
- No se pide compensar tiempo ni se aumenta la carga por haber terminado antes.
- Se conserva el registro de sesión, pausas, descansos, cambio de ejercicio y preferencias adaptativas de 0.3.0.
- Nueva regresión cubre la adaptación después de terminar una sesión antes de tiempo.
