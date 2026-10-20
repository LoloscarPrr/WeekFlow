# WF-BRAIN-007 — Preguntas al Asistente desde el estado real

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-20
Product: WeekFlow Blueprint Maestro v4.0

## Problem
En 0.5.15, el Asistente interpreta cambios reales, pero una pregunta simple («¿Qué sigue?», «¿Entrené hoy?», «¿Cómo va mi descanso?») retorna «No sé aplicar ese cambio». El Brain ya dispone de un contexto compartido de Ahora, energía, Move, Food y Rest. El usuario no debería entrar a cinco pantallas para conocer algo que la app ya sabe.

## Desired behavior
Identificar una familia limitada de consultas del día en español y responder con información derivada exclusivamente del estado canónico leído en ese instante. No hacer inferencias sobre comida ingerida si solo existen registros Food ni sobre tiempo libre si no existe calendario completo. No crear acciones `BrainActionProposal` ni escrituras durante una consulta. Conservar confirmación/undo para cambios.

## Roadmap fit
- Phase decision: NOW.
- Reason: sección 14 Blueprint v4.0, fase 0.7.x: «Responder sobre comidas, rutinas, descanso y disponibilidad usando el mismo estado» y «saber quedarse callado». Es un paso concreto antes de 0.8.x Smart Import.

## Scope
- Un parser puro y conservador de preguntas: «qué sigue/toca», «energía», «entrené/Move», «Food/comidas registradas», «Rest/descanso».
- Respuestas breves basadas en `AssistantRealState`, nunca en valores hardcodeados del día.
- Lectura fresca de estado canónico al enviar pregunta; ningún cambio en SQLite ni recordatorios.
- Una sola respuesta visible; mientras se responde una pregunta se descarta una propuesta pendiente sin aplicarla.
- Encabezado/placeholder/botón del Asistente habilitados tanto para preguntas como para cambios («Enviar»).
- Tests puros de interpretación y respuestas con escenarios vacíos/reales; test estructural de consulta read-only; conservar regresiones Brain 0.7.1–0.7.6.
- Versión técnica WeekFlow 0.5.16, source versionCode 108; package, firma y compatibilidad persistentes.

## Non-goals
- Sin IA remota/LLM, voz, predicciones médicas o consejos nutricionales no sustentados.
- No crear sesiones Move, comidas, citas, ni planificación nueva desde una pregunta.
- No contestar con supuestas disponibilidades horarias precisas, ni Smart Import.
- No cambiar los motores canónicos Ahora/Move/Food/Rest ni su almacenamiento.
- No crear chat histórico ni duplicar tarjetas de estado.

## Acceptance criteria
- AC1: preguntas soportadas se detectan aunque incluyan ¿?, mayúsculas o tildes; órdenes/frases fuera de catálogo no se reinterpretan como preguntas.
- AC2: «¿Qué sigue?» usa exactamente el estado real de Ahora.
- AC3: energía, Move, Food y Rest se responden desde `AssistantRealState`, con estados vacíos y sin inventar hechos.
- AC4: consulta refresca contexto desde persistencia canónica y no escribe estado ni emite propuestas.
- AC5: cambios de turno, energía, salida real absoluta/relativa, confirmación y undo mantienen flujo actual.
- AC6: UI admite pregunta/cambio con una sola respuesta, CTA accesible y sin panel nuevo.
- AC7: Quality CI, regresiones y Android firmado 0.5.16 pasan; QA física marcada pendiente mientras no se compruebe.

## Data/UI
No migration, keys or new persisted data. Pure question parser/responder + Assistant controller/UI. Un único mensaje de respuesta.

## Edge cases/verification
- Día libre, sin comida/historial Move, energía distinta, descanso real vs sugerencia.
- Preguntas vs acciones ("estoy cansado" NO es pregunta); consultas desconocidas rechazan sin escribir.
- Pregunta mientras existe una propuesta: no ejecutar la propuesta sin confirmación.
- QA de teclado y safe area; release APK instalada como update en dispositivo pendiente de comprobación.

## Verification
Pending CI and device QA.
