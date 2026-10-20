# WF-BRAIN-007 — Preguntas sobre el estado real

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-20
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problema
El Asistente en 0.5.15 puede registrar cambios confirmados, pero todavía no responde preguntas sencillas sin proponer una modificación. El Blueprint 0.7.x exige responder sobre rutinas, comida, descanso y disponibilidad desde el mismo estado canónico y saber callarse cuando no hay información.

## Comportamiento deseado
Reconocer un conjunto acotado y explícito de preguntas en español natural sobre Ahora, Move, Food, Rest y la energía actual. Responder de forma breve con el contexto ya calculado por `readAssistantContext`, sin crear un segundo almacén ni aplicar `BrainActionProposal`. Frases desconocidas conservan la respuesta de no soportado sin inventar datos.

## Roadmap fit
- Phase decision: NOW.
- Reason: requisito expreso de 0.7.x Assistant + Brain; las consultas son el siguiente paso acotado después de cambios reales y reversión.
- Smart Import / OCR multimodal permanece en 0.8.x.

## Scope
- Helper puro `src/assistant/questions.ts` para normalizar, reconocer y responder preguntas sobre el contexto `AssistantRealState`.
- Preguntas explícitas de ejemplo: «¿qué viene ahora?», «¿ya entrené hoy?», «¿qué comí hoy?», «¿cómo voy con el descanso?», «¿qué energía tengo?».
- El controller detecta la pregunta antes del parser de acciones, vuelve a leer el contexto canónico para estar actualizado, descarta una propuesta aún no confirmada sin escribir, y muestra la respuesta en el área existente.
- El recibo previo de deshacer se conserva hasta que otra acción confirmada lo reemplace, en la misma sesión.
- Sin UI adicional ni mensajes redundantes; placeholder de entrada puede dar ejemplo de pregunta.
- Version 0.5.16, mismo identificador, firma y actualización Android.
- Pruebas de reconocimiento estricto, afirmaciones negativas basadas en estado real y regresiones de acciones.

## Non-goals
- No conversación abierta, preguntas genéricas, búsqueda web, cloud LLM ni voz.
- No recomendaciones de nutrición/salud ni rutinas especulativas.
- No acciones automáticas, ni replanificación nueva, ni Smart Import.
- No duplicar reglas de Ahora/Move/Food/Rest ni escribir SQLite para preguntas.

## Acceptance criteria
- AC1: Una pregunta explícita de Ahora devuelve título y metadatos reales, incluso cuando no hay próximo momento.
- AC2: Pregunta sobre Move responde «hecho» solo si `doneToday` es real; distingue ausencia de sesión.
- AC3: Pregunta sobre Food comunica cantidad y último alimento solo cuando constan registros; con día vacío no inventa comida.
- AC4: Pregunta sobre Rest muestra título/metadatos canónicos y energía se responde desde `energyLabel`.
- AC5: Preguntas reconocidas son read-only, no generan propuesta, no llaman `applyBrainAction`, no guardan ni sincronizan recordatorios.
- AC6: Frases que son órdenes («estoy cansado», «mañana entro a las 10» o «salí una hora tarde») siguen generando los resultados existentes; preguntas ambiguas/mixtas no causan escrituras.
- AC7: Cancelar una propuesta pendiente mediante una pregunta no aplica su cambio; un recibo anterior de undo permanece disponible.
- AC8: Quality CI y build Android release 0.5.16 pasan, APK/AAB firmado con mismo paquete y firma. QA visual/física de Android requiere comprobación en teléfono.

## Persistencia y UI
No hay esquema ni estado nuevo persistido. Respuestas de texto en el mensaje actual del Asistente. Ningún permiso Android ni backend adicional.

## Edge cases y regresiones
Accentos/mayúsculas, signos de pregunta, día sin Move ni comida, nombres de platos concretos, título Ahora neutral, propuesta pendiente, turnos nocturnos y respuestas basadas en datos recién refrescados. No confundir pregunta «¿estoy cansado?» con la orden «estoy cansado».

## Verification
Pendiente de ejecutar CI.
