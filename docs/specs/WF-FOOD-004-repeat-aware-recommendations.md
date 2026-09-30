# WF-FOOD-004 — Recomendaciones sin repetición mecánica

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 30-09-2026
Blueprint: WeekFlow Blueprint Maestro v4.0
Roadmap target: 0.3.x — Food completo

## Problem
Food ya prioriza recetas según despensa, turno/contexto, tiempo, presupuesto y energía, pero ignoraba completamente el historial local. Como resultado, una receta consumida recientemente podía seguir apareciendo primera todos los días, contradiciendo el criterio del Blueprint v4.0 de evitar repetición.

## Desired behavior
- Food usa el historial local reciente como una señal adicional de ranking.
- Una receta consumida recientemente pierde prioridad frente a otra opción comparable y viable.
- La penalización es gradual: lo de hoy pesa más que algo de hace varios días.
- Repetición nunca oculta recetas ni invalida una opción que sigue siendo la más viable.
- Entradas manuales no penalizan recetas por coincidencia accidental de texto.
- Comidas provenientes de receta, sugerencia o porción preparada sí pueden contar como consumo reciente cuando el título corresponde a una receta conocida.
- No hay lenguaje de culpa ni advertencias por repetir una comida.

## Scope
- Añadir una señal pura de recencia al ranking de `src/food/recommendations.ts`.
- Derivar títulos de recetas consumidas desde `food-history`, limitado al historial local ya existente.
- Integrar esa señal en `app/food.tsx` y refrescarla al registrar/corregir/quitar una comida.
- Añadir regresiones de ranking sin romper pantry/context/time/budget/energy.
- Bump técnico a 0.4.7 / source Android versionCode 89.

## Non-goals
- No bloquear comidas repetidas.
- No crear calendario rígido de comidas.
- No añadir nutrición/calorías/macros.
- No inferir dieta, alergias o salud.
- No añadir IA ni cloud.
- No modificar foto de despensa, compras o Prep salvo compatibilidad.

## Data / persistence impact
- Ningún esquema nuevo.
- Reutiliza `food-history`, que ya conserva hasta 14 días.
- No se modifica el formato de `FoodEntry` ni `FoodDayRecord`.

## UI / UX impact
- No se añade panel nuevo.
- El orden de `Recetas viables` se vuelve menos repetitivo.
- No se muestra mensaje culpabilizante ni se impide cocinar una receta repetida.

## Ranking rule
- El score base existente sigue siendo la fuente principal: despensa, faltantes, contexto, tiempo, esfuerzo, energía, presupuesto y portabilidad.
- Se aplica una penalización de recencia solo a recetas cuyo título coincide con consumos no manuales recientes.
- La penalización decrece por antigüedad y tiene tope para no eclipsar una ventaja grande de viabilidad.
- Empates siguen resolviéndose con las reglas deterministas actuales.

## Acceptance criteria
- [ ] AC1 — Sin historial reciente, `rankFoodRecipes` conserva el orden actual.
- [ ] AC2 — Entre dos recetas comparables, una consumida hoy queda debajo de una no consumida recientemente.
- [ ] AC3 — Una comida de varios días atrás recibe menos penalización que una de hoy.
- [ ] AC4 — Una receta repetida sigue apareciendo; nunca se filtra del resultado.
- [ ] AC5 — Una entrada `manual` con el mismo texto que una receta no genera penalización.
- [ ] AC6 — Consumos `recipe`, `suggestion` y `prepared` pueden alimentar recencia si corresponden a una receta conocida.
- [ ] AC7 — Pantry coverage/faltantes siguen pudiendo superar la penalización cuando una receta repetida es claramente la opción más viable.
- [ ] AC8 — Registrar/completar una receta actualiza las recomendaciones sin necesitar reiniciar la app.
- [ ] AC9 — `food-core`, `food-photo-prep` y regresiones globales pasan.
- [ ] AC10 — Quality PR + main pasan y Android genera APK/AAB firmado 0.4.7.

## Edge cases
- Historial vacío o corrupto: comportamiento base sin penalización.
- Días sin entradas: no alteran ranking.
- Dos consumos de la misma receta: penalización puede acumularse con tope, sin ocultarla.
- Título manual igual a receta: ignorado para recencia.
- Receta eliminada del catálogo: su historial no afecta recetas actuales.
- Cambio de hora en una comida conserva su semántica de consumo.

## Verification evidence prepared
- `src/food/recommendations.ts` incorpora `recentFoodRecipeConsumptions` y penalización decreciente con tope.
- `app/food.tsx` carga `food-history` y lo refresca inmediatamente tras cambios de historial.
- `tests/food-core.test.ts` cubre ranking base, recencia hoy/antigua, no filtrado, manual ignorado y viabilidad dominante.
- `CHANGELOG-0.4.7.md`, `package.json` 0.4.7 y source Android versionCode 89 preparados.

## Verification plan remaining
- Ejecutar TypeScript + suite completa Quality en PR.
- Si pasa, marcar AC1–AC9 PASS y fusionar.
- Verificar main Quality + Android firmado 0.4.7 para AC10.

## Verification result
IMPLEMENTED — CI PENDING.
