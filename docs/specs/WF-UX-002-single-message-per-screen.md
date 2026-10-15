# WF-UX-002 — Una sola vez, en el lugar correcto

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-15
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
La interfaz repite encabezados y explicaciones técnicas. En Ahora se muestran “AHORA”, “Qué importa ahora” y “DÍA VIVO” antes de la misma prioridad. Rest muestra reglas internas y algunos módulos repiten descripciones que no ayudan a actuar.

## Desired behavior
Cada pantalla muestra la información útil una vez, en el componente donde se utiliza. El funcionamiento interno queda en las capas de dominio/specs; no en tarjetas educativas permanentes.

## Roadmap fit
- Phase decision: NOW.
- Reason: reducción de carga mental y microcopy es mantenimiento UX transversal del núcleo actual, no un módulo nuevo.

## Scope
- Ahora: reemplazar “DÍA VIVO” por “AHORA” y eliminar el hero redundante; conservar prioridad, salida real, selección de energía, información útil de traslado y próximos momentos.
- Rest: retirar panel de “REGLAS ACTIVAS” y explicaciones del motor sin borrar guardarraíles.
- Move/Food/Habits/Jardín/Asistente/Semana: retirar títulos explicativos y textos obvios/reiterados identificados en la auditoría; preservar señales importantes, confirmaciones, accesibilidad y acciones.
- Prueba de estructura para evitar reincidencia de las copias más visibles.

## Non-goals
- No eliminar controles, navegación, preferencias o estados reales.
- No alterar reglas de planificación, seguridad, persistencia, notificaciones ni decisiones del Brain.
- No prometer ausencia universal de redundancia semántica sin auditoría en dispositivo: criterio verificable sobre pantallas auditadas.

## Acceptance criteria
- AC1: Ahora contiene una única cabecera «AHORA» sobre la tarjeta viva; ya no muestra el hero ni «DÍA VIVO».
- AC2: La información de energía se controla en un único bloque; la duración de traslado se conserva cuando existe.
- AC3: Rest no muestra «REGLAS ACTIVAS», pero conserva el plan, la pausa opcional y los controles previos.
- AC4: Move y las pantallas auditadas omiten textos explicativos internos y redundantes; ninguna acción relevante desaparece.
- AC5: Las pruebas de estructura protegen los casos de duplicación encontrados y no cambian el almacenamiento.

## Data / persistence impact
None.

## UI / UX impact
Menos desplazamiento, menos encabezados repetidos, explicaciones solo cuando son necesarias.

## Edge cases / regression plan
Revisar salidas reales y confirmación de reajuste, energía, timeline, Rest durante turno, Move perfil plegado/desplegado y Asistente con propuesta pendiente. Ejecutar Quality CI y Android antes de liberar. Validar visualmente en móvil antes de cerrar.

## Verification progress
- PASS — AC1: Ahora solo usa «AHORA» y conserva la tarjeta viva y sus acciones.
- PASS — AC2: selector de energía único; traslado conserva minutos de ida/vuelta.
- PASS — AC3: Rest mantiene planificación y descanso opcional; desaparece «REGLAS ACTIVAS».
- PASS — AC4: revisión de Ahora, Move, Rest, Food, Semana, Jardín, Hábitos, Asistente, Onboarding y Notificaciones; no se retiraron controles de acción.
- PASS — AC5: tests de estructura añadidos y pruebas originales ajustadas.
- PASS — Quality #38822617223: TypeScript + regresiones; BLOCKED — APK Android y QA visual todavía pendientes.
