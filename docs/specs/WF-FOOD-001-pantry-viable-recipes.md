# WF-FOOD-001 — Despensa, recetas viables y compras

Status: DONE
Owner: WeekFlow
Approved by: Oscar · 23-09-2026
Blueprint mapping: 0.4.x · Food completo

## Problem

Food ya sugiere comidas según turno/energía y puede guiar cuatro recetas, pero no sabe qué ingredientes tiene la persona, no distingue una receta viable de una que requiere compras y no ofrece una lista de compras persistente. Por eso todavía no resuelve una comida real de punta a punta.

## Desired behavior

- La persona puede escribir lo que tiene disponible en casa en una sola entrada simple.
- Food normaliza ese texto a una despensa local editable sin exigir cantidades exactas.
- La biblioteca de recetas contiene ingredientes con claves canónicas para comparar contra la despensa.
- Cada receta muestra tiempo, porciones, dificultad, qué ingredientes ya tienes, qué ingredientes faltan, sustituciones posibles y compatibilidad con el tiempo/contexto actual.
- Las propuestas priorizan recetas que caben en el tiempo/contexto del día, requieren menos ingredientes faltantes, exigen menos preparación cuando la energía es baja y respetan preferencias de presupuesto/tiempo.
- Desde una receta se pueden enviar ingredientes faltantes a una lista de compras local.
- La lista de compras permite marcar/completar y quitar elementos.
- Completar una receta sigue registrando la comida en el historial actual.
- “Comí otra cosa”, corrección de hora y eliminación continúan funcionando.
- No hay calorías ni clasificación médica.

## Scope

### Despensa
- Nuevo modelo persistido FoodPantry.
- Entrada de texto separada por comas/saltos de línea.
- Normalización de aliases básicos en español (ej. huevos→huevo, tomates→tomate).
- Agregar y quitar ingredientes sin borrar historial de Food.
- Persistencia en SQLiteStateStore.

### Preferencias Food
- Nuevo modelo persistido FoodPreferences:
  - tiempo máximo preferido: 10 / 20 / 30+ min;
  - presupuesto: ajustar / normal / flexible;
  - cocinar: mínimo / normal;
- Valores legacy seguros por defecto.
- Las preferencias son contexto, no una restricción clínica.

### Biblioteca
- Convertir recetas actuales a ingredientes canónicos.
- Ampliar la biblioteca con recetas simples reutilizando ingredientes frecuentes.
- Cada ingrediente tiene key, nombre visible, cantidad y flag opcional.
- Mantener sustituciones y pasos.

### Ranking / viabilidad
- Nueva función pura que calcula FoodRecipeMatch: owned, missing, optionalMissing, pantryCoverage y estimatedFit.
- Ranking determinista por contexto/energía/tiempo/presupuesto.
- Ninguna receta afirma que el usuario tiene un ingrediente no registrado.

### Compras
- Nuevo FoodShoppingItem persistido.
- Añadir faltantes de una receta sin duplicados.
- Marcar comprado / pendiente y quitar.
- Al marcar comprado, se puede incorporar el ingrediente a la despensa con acción explícita; nunca automático silencioso.

### UI
- Food mantiene contexto y registro actual.
- Nuevo bloque “¿Qué tienes disponible?” compacto.
- Nuevo bloque “Recetas viables” con cobertura y faltantes.
- Acceso a pantalla de biblioteca Food.
- Acceso a lista de compras.
- Guided recipe muestra faltantes y acción “Agregar faltantes a compras” antes de cocinar.
- Keyboard-safe en Android.

## Non-goals

- Reconocimiento de ingredientes desde foto/cámara: siguiente spec, deberá alimentar el mismo FoodPantry.
- Precios reales/online o promesas de costo exacto.
- Meal prep semanal completo: siguiente spec después de validar despensa/compras.
- Sincronización cloud.
- Calorías/macros.
- Diagnóstico nutricional, alergias inferidas o dietas médicas.
- Reemplazar el historial actual.

## Data / persistence impact

Nuevas keys locales:
- food-pantry
- food-preferences
- food-shopping

No hay migración SQL de tablas: se reutiliza SQLiteStateStore.
Food history existente permanece compatible.

## Edge cases

- Entrada vacía no altera despensa.
- Duplicados y plural/singular básico no crean dos ingredientes.
- Receta sin todos sus ingredientes sigue visible como opción, pero marcada con faltantes.
- Ingrediente opcional no bloquea viabilidad.
- Lista de compras no duplica la misma key.
- Marcar comprado no modifica despensa sin acción explícita.
- Preferencias antiguas inexistentes cargan con defaults.
- Una despensa vacía sigue permitiendo explorar recetas y construir compras.
- Turno nocturno/contexto existente no se rompe.

## Acceptance criteria

- [x] AC1 — Legacy carga despensa vacía, preferencias default y compras vacías sin afectar historial.
- [x] AC2 — Texto `huevos, tomate, arroz` produce tres ingredientes canónicos sin duplicados.
- [x] AC3 — Quitar un ingrediente de despensa persiste.
- [x] AC4 — Las recetas exponen claves canónicas y la biblioteca contiene al menos 10 recetas guiables.
- [x] AC5 — FoodRecipeMatch separa owned/missing/optionalMissing correctamente.
- [x] AC6 — Ranking favorece menos faltantes cuando contexto/tiempo son equivalentes.
- [x] AC7 — Energía baja favorece recetas de menor preparación.
- [x] AC8 — Tiempo máximo preferido reduce prioridad de recetas más largas sin ocultarlas totalmente.
- [x] AC9 — UI Food permite agregar/quitar ingredientes de despensa por texto.
- [x] AC10 — UI muestra recetas viables con “Tienes X/Y” y faltantes reales.
- [x] AC11 — Faltantes de una receta pueden agregarse a compras sin duplicados.
- [x] AC12 — Compras permite pendiente/comprado/quitar.
- [x] AC13 — Pasar comprado a despensa requiere acción explícita.
- [x] AC14 — Guided recipe conserva ingredientes, sustituciones, pasos y registro al completar.
- [x] AC15 — “Comí otra cosa”, corregir hora y quitar registro continúan funcionando.
- [x] AC16 — No se introducen calorías/macros ni claims médicos.
- [x] AC17 — TypeScript + regresiones pasan.
- [x] AC18 — Android release 0.4.0 genera APK + AAB firmados.

## Verification plan

- Unit/regression tests para normalización, ranking, compras y legacy defaults.
- Typecheck.
- Quality CI en PR y main.
- Android signed release build.
- Validación física posterior de teclado, scroll y legibilidad en teléfono pequeño.

## Verification result

- AC1–AC16: PASS — implementation + regression coverage merged in `d43b1d1bb72300491be2a620b50b06a6e51c6889`.
- AC17: PASS — PR Quality #180 and main Quality #181.
- AC18: PASS — Android #149 generated signed WeekFlow 0.4.0 APK + AAB and published both artifacts.
- Physical-device keyboard/scroll ergonomics: NOT RUN in CI; remains a manual field-validation item and does not change the functional closure above.
