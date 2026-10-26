# WF-BRAIN-012 — Consejos offline entre Ahora, Rest y Move

Blueprint Maestro v4.0: secciones 3, 9, 11 y 14. La realidad y el descanso tienen prioridad; Brain explica usando fuentes canónicas, no crea calendarios alternativos.

## Objetivo
Mientras OpenAI API continúa sin presupuesto ni clave, el Asistente debe responder preguntas de decisión sobre el día actual sin llamar a ningún proveedor remoto ni inventar un horario. Ejemplos: «¿Qué priorizo hoy?», «¿Me conviene entrenar hoy?» y «¿Qué priorizo entre turno y descanso?».

## Implementación
- `interpretDayAdviceQuestion` reconoce consultas explícitas del día, entrenar o recuperar; nunca convierte órdenes ni fechas futuras en acciones.
- `answerDayAdvice` sintetiza lectura de `getNowView`, `getRestView`, `MovePreferences` y último feedback real de Move.
- Prioriza jornada/traslado, recuperación post turno nocturno, agotamiento, ajustes de salida pendientes, sesiones ya completadas y compatibilidad con equipamiento/restricciones.
- Muestra un horario solo cuando aparece en `nowView.upcomingMoments`, avisando que sigue siendo sugerencia. Sin un hueco validado, no inventa uno.
- La consulta es estrictamente read-only: no invoca Brain Actions, no escribe SQLite ni agenda notificaciones.
- Botón compacto «¿Qué priorizo hoy? · Sin conexión» en Asistente.
- Pruebas de preguntas, tiempo no inventado, protección de Rest, conflictos/turno y guardas de solo lectura.

## Límites
- **No es un LLM offline**. Sigue siendo orientación determinista local con preguntas específicas.
- No calcula o garantiza disponibilidad horaria fuera de la información real que Ahora tiene disponible.
- No reprograma toda la semana, ni modifica turnos, descanso, ejercicios o notificaciones. Los cambios existentes continúan requiriendo confirmación.
- La pasarela OpenAI preparada en 0.5.25 permanece desactivada hasta contar con presupuesto y credenciales.

## QA
- TypeScript + pruebas de regresión GitHub Quality.
- Compilación Android firmada posterior a merge.
- Verificación manual en teléfono aún pendiente.
