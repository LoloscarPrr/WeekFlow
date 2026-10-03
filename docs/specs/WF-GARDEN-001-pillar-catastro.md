# WF-GARDEN-001 — Catastro visual no punitivo de pilares

**Status:** LOCKED

## Problem
Jardín debe representar cómo se están cuidando los pilares de WeekFlow, pero actualmente la pantalla está centrada en crear y completar hábitos. Eso desplaza el propósito canónico de Jardín y hace difícil obtener una lectura rápida de equilibrio semanal.

## Desired behavior
Jardín vuelve a ser una vista de catastro visual de los ocho pilares. Cada pilar muestra un icono/emoji, nombre, una evidencia breve cuando existe y un estado amable. Las métricas son descriptivas, nunca una puntuación de vida. Habits conserva exactamente sus datos y funciones, pero se abre en una ruta propia.

## Scope
- Crear un resumen reutilizable de Jardín con los ocho pilares canónicos.
- Usar datos reales existentes para Movimiento, Alimentación y Descanso.
- Mostrar `Sin datos` para pilares que todavía no tienen una fuente persistida confiable.
- Mover la UI actual de hábitos a `/habits` sin cambiar el modelo ni la persistencia.
- Añadir desde Jardín un acceso secundario a Hábitos flexibles para no perder accesibilidad mientras Pilares todavía no tiene hub dedicado.
- Mantener scroll seguro, navegación inferior y estilo general WeekFlow.

## Non-goals
- No crear métricas nuevas para Relaciones, Bienestar, Hogar, Responsabilidades o Tiempo personal.
- No implementar el WeekFlow Brain ni automatización entre pilares.
- No crear un score global, porcentaje de equilibrio, ranking, rachas ni castigos.
- No implementar aún el hub completo de Pilares ni `esencial / deseable / opcional` en Habits.
- No modificar lógica de Move, Food o Rest.

## Acceptance criteria
1. Jardín muestra los ocho pilares canónicos: Descanso, Alimentación, Movimiento, Relaciones, Bienestar, Hogar, Responsabilidades y Tiempo personal.
2. Movimiento muestra la cantidad real de sesiones registradas en la semana local actual.
3. Alimentación muestra la cantidad real de momentos/comidas registradas en la semana local actual.
4. Descanso refleja si existe un plan/timeline de recuperación real derivado del estado actual de Rest.
5. Los cinco pilares sin fuente confiable muestran `Aún sin datos` / `Sin datos` y no inventan progreso.
6. No aparece ningún score global, porcentaje de vida, ranking, deuda, racha o mensaje de culpa.
7. La pantalla de hábitos actual sigue accesible en `/habits`, conserva crear/editar, frecuencia flexible, mini-versión, Hecho, Versión mini, deshacer y reprogramación.
8. Los datos de hábitos existentes siguen usando `habits-state` y no requieren migración SQLite.
9. Jardín ofrece un acceso secundario visible a Hábitos flexibles sin convertir Habits en un noveno pilar.
10. Quality/regresiones relevantes pasan antes de merge.

## Data / persistence impact
- Sin tablas nuevas ni migraciones.
- Garden lee `move-history`, `food-history`, estado canónico de día/semana y `habits-state` usando servicios existentes.
- Habits mantiene el mismo `SQLiteStateStore` y la misma clave `habits-state`.

## UI / UX impact
- Jardín pasa de formulario/lista de hábitos a catastro de pilares.
- Cada tarjeta usa icono grande, dato breve y estado textual.
- Estados permitidos en esta primera etapa: `Equilibrado`, `Necesita atención` cuando hay evidencia explícita de ausencia de actividad en un área ya instrumentada, y `Sin datos` cuando WeekFlow todavía no posee información confiable.
- `Floreciendo` se reserva para una futura regla canónica; no se infiere con umbrales arbitrarios en esta spec.
- Hábitos abre en pantalla propia con la misma interacción ya validada.

## Edge cases / regressions
- Semana sin sesiones Move: mostrar 0 sesiones y mensaje amable, sin penalización.
- Semana sin registros Food: mostrar 0 momentos y mensaje amable, sin inferir dieta mala.
- Sin próximo turno/plan Rest: mostrar estado neutral, no inventar hora de sueño.
- Sesiones Move con timestamps de semanas previas no cuentan en la semana actual.
- Food conserva límite/historial existente; solo se agregan entradas cuyo `date` cae en la semana actual.
- Navegar a `/habits` no crea ni transforma datos.

## Verification plan
- Test unitario de resumen Garden con fechas alrededor de inicio/fin de semana.
- Test estructural: ocho pilares presentes, acceso a `/habits`, ausencia de lenguaje punitivo/score.
- Reejecutar tests de Habits y Quality completo.
- Build Android release en `main` después del merge.
