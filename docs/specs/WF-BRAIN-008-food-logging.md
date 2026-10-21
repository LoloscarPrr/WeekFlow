# WF-BRAIN-008 — Registrar lo comido desde Asistente

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-21
Product: WeekFlow Blueprint Maestro v4.0

## Problem
Prueba real en Android: «Comí pan tostado con margarina» en Asistente devuelve «Todavía no sé aplicar ese cambio». Food ya ofrece «+ Comí otra cosa» y guarda un FoodEntry canónico, pero Brain no tiene una acción confirmable para crear ese registro.

## Desired behavior
Cuando el usuario declara inequívocamente qué comió hoy («Comí pan tostado con margarina», «Desayuné avena», «Almorcé arroz con pollo»), Asistente muestra propuesta explícita de agregar esa descripción a Food, sin estimar calorías/macros/cantidades. Solo tras confirmar, Brain genera un registro Food de fuente manual que queda visible en el módulo Food y en las consultas del Asistente. «Deshacer cambio» elimina exclusivamente esa entrada si el registro del día permanece sin modificaciones posteriores.

## Roadmap fit
- Phase decision: NOW.
- Reason: 0.7.x Asistente/Brain debe usar el estado real de Food, registrar cambios con confirmación y permitir reversión; Food ya está operativo. No abre Smart Import 0.8.x.

## Scope
- Interpretación local determinista de declaraciones en pasado «comí / desayuné / almorcé / cené» más descripción válida, con soporte de tildes.
- Descartar frases negativas («no comí»), preguntas («¿qué comí?»), relativas a otros días o incompletas; no inventar ingredientes ni momento exacto de ingesta.
- Nueva acción Brain tipada `log-food-entry` sobre `FoodDayRecord` canónico, con recibo de before/after de Food para undo seguro.
- Reusar `saveFoodEntry`, `loadFoodDay` y `removeFoodEntry` existentes; no llamar directamente a SQLite ni crear otra fuente de verdad.
- El registro usa la fecha/hora de confirmación como **hora de registro**, sin afirmar cuándo se consumió realmente, y `kind:'other'` `source:'manual'` igual a la entrada manual Food.
- Confirmar una vez, soportar undo sin sobrescribir cambios hechos desde Food; no sincronizar notificaciones de jornada para registros Food.
- Pantalla de Asistente ya contiene tarjeta de propuesta y botón de deshacer; no crear paneles.
- Version técnica 0.5.17, Android source versionCode 109; mismo paquete/firma.

## Non-goals
- No reconocimiento libre con modelo remoto/IA ni cálculo nutricional, cantidades, recetas, favoritos o supuestas alergias.
- No modificar motores Food/Rest/Move/Brain scheduling.
- No interpretar alimentos de ayer/mañana ni comidas no declaradas explícitamente.
- No nueva persistencia SQLite ni cambiar la app Pills.
- No fotos ni OCR.

## Acceptance criteria
- AC1: Frase exacta del usuario crea propuesta `log-food-entry` con título «pan tostado con margarina»; nada se guarda antes de confirmar.
- AC2: Variantes de comidas en pasado/tildes funcionan y conservan descripción, sin alterarla ni inferir energía/calorías.
- AC3: Preguntas Food («¿qué comí hoy?»), negaciones, fechas ajenas, texto vacío, palabras sin descripción y frases ambiguas no se registran.
- AC4: Confirmación pasa por `applyBrainAction` y guarda en la fuente Food manual ya existente, sin tocar DayState ni WeekSchedule.
- AC5: El registro aparece en Food al enfocar pantalla y en consultas de Food del Asistente, sin reiniciar ni crear estado paralelo.
- AC6: «Deshacer cambio» emplea `undoBrainAction`, elimina solo la entrada afectada si Food no cambió; conflicto si hubo un cambio posterior.
- AC7: Acciones originales de energía/turno/salida real y respuestas a preguntas siguen intactas.
- AC8: Quality CI/regresiones y Android release APK/AAB firmado 0.5.17; QA física en teléfono pendiente hasta que el usuario la pruebe.

## Data and UX
No schema migration, no new permissions. `FoodDayRecord` se añade opcionalmente al contrato Brain para no romper consumidores existentes. Asistente continúa con una tarjeta de propuesta y un solo mensaje.

## Edge cases
- Doble confirmación: ID determinista por propuesta evita duplicación.
- Cruce de medianoche: fecha del registro al confirmar y undo ligado a esa fecha.
- Cambios desde Food posteriores a agregar: undo no borra datos nuevos.
- Intento de registrar un plato vacío/no consumido se rechaza.
- Abre Food desde Asistente tras registro: historial se actualiza vía focus.

## Verification
- AC1: PASS — parser y prueba `assistant-food-log.test.ts` reconocen «Comí pan tostado con margarina», conservan su texto y crean propuesta confirmable sin escritura.
- AC2: PASS — test incluye desayuno, almuerzo, cena y tildes, conservando descripción sin nutrición inferida.
- AC3: PASS — casos negativos, preguntas, fecha ajena, incompletos y dos acciones se rechazan; consultas Food existentes siguen read-only.
- AC4: PASS — `applyBrainAction` produce FoodDay y solo controller confirmado llama `saveFoodEntry`, sin escribir DayState/WeekSchedule.
- AC5: PASS por inspección de contrato — `app/food.tsx` refresca `loadFoodDay` al enfocar y preguntas leen estado fresco; QA visual en dispositivo pendiente.
- AC6: PASS — `undoBrainAction` compara snapshot de FoodDay, `removeFoodEntry` borra solo ID de propuesta; test cubre cambios posteriores y deshacer.
- AC7: PASS — pruebas previas Brain/Assistant/Food y nuevo test puro ejecutados por CI.
- AC8: Quality PR #39546790022 PASS. Android Release firmado 0.5.17 y QA física: PENDING.
- Sin migraciones SQLite; versión técnica 0.5.17, Android source versionCode 109 y package/firma existentes.
