# WF-MOVE-001 — Zonas a evitar en Move

Status: LOCKED
Owner: WeekFlow
Blueprint mapping: MOV-11

## Problem
Move ya adapta duración, enfoque y equipamiento, y permite cambiar ejercicios, pero todavía no puede respetar zonas que el usuario prefiera no cargar en una sesión. Eso deja una brecha frente a MOV-11 y puede obligar al usuario a cambiar ejercicios manualmente durante la rutina.

## Desired behavior
Antes de iniciar una sesión, el usuario puede marcar zonas corporales que prefiere no cargar hoy. La preferencia se guarda localmente y la generación/cambio de ejercicios evita movimientos etiquetados con esas zonas sin diagnosticar lesiones ni sugerir tratamiento.

## Scope
- Añadir una preferencia persistente `avoidAreas` a Move.
- Ofrecer controles simples para hombros, rodillas, muñecas y espalda baja.
- Añadir metadatos de zonas a los ejercicios iniciales.
- Excluir ejercicios incompatibles al generar rutinas, previews y al usar “Cambiar ejercicio”.
- Mantener un fallback seguro de biblioteca cuando las restricciones dejan pocas alternativas.
- Añadir regresiones automatizadas para filtrado por zonas y compatibilidad con preferencias antiguas.
- Publicar como Alpha 0.3.11 / Android versionCode 67.

## Non-goals
- No diagnosticar dolor, lesión o condición médica.
- No preguntar intensidad, causa o duración de molestias.
- No rehabilitación, fisioterapia ni recomendaciones clínicas.
- No añadir nuevas rutinas o videos en esta spec.
- No cambiar la lógica de duración recomendada.

## Acceptance criteria
- [ ] AC1 — Move muestra una sección de zonas a evitar con hombros, rodillas, muñecas y espalda baja, permitiendo activar/desactivar cada zona.
- [ ] AC2 — Las zonas seleccionadas se persisten mediante las preferencias existentes de Move y datos antiguos sin `avoidAreas` cargan con lista vacía.
- [ ] AC3 — `routineForDuration` no incluye ejercicios cuya metadata intersecta las zonas evitadas.
- [ ] AC4 — La preview respeta exactamente las mismas restricciones que la rutina.
- [ ] AC5 — “Cambiar ejercicio” no propone un ejercicio que cargue una zona evitada.
- [ ] AC6 — Si las restricciones eliminan las alternativas normales, Move usa un ejercicio compatible de fallback y nunca reintroduce silenciosamente una zona bloqueada.
- [ ] AC7 — Equipamiento, enfoque, duraciones 5/10/20/30, pausa/progreso/feedback y persistencia de sesiones mantienen su comportamiento previo.
- [ ] AC8 — Tests de Move cubren al menos rodillas, hombros/muñecas y sanitización de preferencias antiguas.
- [ ] AC9 — La versión pública queda en 0.3.11 y Android versionCode en 67; changelog documenta MOV-11.

## Data / persistence impact
`MovePreferences` añade `avoidAreas: MoveAvoidArea[]`. El formato guardado sigue siendo JSON y `sanitizeMovePreferences` migra implícitamente datos antiguos usando `[]` cuando el campo no existe o contiene valores desconocidos. No requiere migración SQLite.

## UI / UX impact
- Nueva sección dentro de “Cómo quieres moverte”.
- Microcopy debe hablar de “preferir no cargar” y no asumir lesión.
- La preview debe cambiar inmediatamente al alternar una zona.

## Edge cases / regressions
- Varias zonas pueden estar activas simultáneamente.
- Datos persistidos con zonas desconocidas deben ignorarlas.
- El cierre respiratorio debe seguir disponible aun con todas las zonas marcadas.
- No usar un fallback fijo (por ejemplo marcha) si ese fallback está bloqueado por una zona.
- Cambiar equipamiento o enfoque junto con zonas debe componer las restricciones, no reemplazarlas.

## Verification plan
- [ ] Revisar diff contra `main`.
- [ ] Ejecutar/observar Quality del PR (typecheck + tests).
- [ ] Confirmar tests nuevos de zonas y preferencias antiguas.
- [ ] Confirmar app.json/package/changelog consistentes con 0.3.11.
- [ ] Verificar manualmente en código que preview, generación y swap comparten la misma función de compatibilidad.

## Implementation notes
MOV-09 y MOV-10 ya están materialmente implementados en `main`; esta spec no los reimplementa. MOV-11 se agrega sobre el mismo sistema de preferencias y biblioteca para evitar lógica paralela.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
- AC7: PENDING
- AC8: PENDING
- AC9: PENDING
