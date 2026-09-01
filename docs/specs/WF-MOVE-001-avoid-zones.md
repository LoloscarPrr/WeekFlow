# WF-MOVE-001 — Zonas a evitar en Move

Status: DONE
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
- [x] AC1 — Move muestra una sección de zonas a evitar con hombros, rodillas, muñecas y espalda baja, permitiendo activar/desactivar cada zona.
- [x] AC2 — Las zonas seleccionadas se persisten mediante las preferencias existentes de Move y datos antiguos sin `avoidAreas` cargan con lista vacía.
- [x] AC3 — `routineForDuration` no incluye ejercicios cuya metadata intersecta las zonas evitadas.
- [x] AC4 — La preview respeta exactamente las mismas restricciones que la rutina.
- [x] AC5 — “Cambiar ejercicio” no propone un ejercicio que cargue una zona evitada.
- [x] AC6 — Si las restricciones eliminan las alternativas normales, Move usa un ejercicio compatible de fallback y nunca reintroduce silenciosamente una zona bloqueada.
- [x] AC7 — Equipamiento, enfoque, duraciones 5/10/20/30, pausa/progreso/feedback y persistencia de sesiones mantienen su comportamiento previo.
- [x] AC8 — Tests de Move cubren al menos rodillas, hombros/muñecas y sanitización de preferencias antiguas.
- [x] AC9 — La versión pública queda en 0.3.11 y Android versionCode en 67; changelog documenta MOV-11.

## Data / persistence impact
`MovePreferences` añade `avoidAreas: MoveAvoidArea[]`. El formato guardado sigue siendo JSON y `sanitizeMovePreferences` migra implícitamente datos antiguos usando `[]` cuando el campo no existe o contiene valores desconocidos. No requiere migración SQLite.

## UI / UX impact
- Nueva sección dentro de “Cómo quieres moverte”.
- Microcopy habla de “preferir no cargar” y no asume lesión.
- La preview cambia inmediatamente al alternar una zona porque deriva de las preferencias actuales.

## Edge cases / regressions
- Varias zonas pueden estar activas simultáneamente.
- Datos persistidos con zonas desconocidas se ignoran durante sanitización.
- El cierre respiratorio sigue disponible aun con todas las zonas marcadas.
- El fallback ya no usa marcha de forma incondicional cuando rodillas está bloqueada.
- Equipamiento, enfoque y zonas se evalúan en la misma función de compatibilidad.

## Verification plan
- [x] Revisar diff contra `main`.
- [x] Ejecutar/observar Quality del PR (typecheck + tests).
- [x] Confirmar tests nuevos de zonas y preferencias antiguas.
- [x] Confirmar app.json/package/changelog consistentes con 0.3.11.
- [x] Verificar manualmente en código que preview, generación y swap comparten la misma función de compatibilidad.

## Implementation notes
MOV-09 y MOV-10 ya están materialmente implementados en `main`; esta spec no los reimplementa. MOV-11 se agrega sobre el mismo sistema de preferencias y biblioteca para evitar lógica paralela.

## Verification result
- AC1: PASS — `MovePlan` renderiza cuatro zonas seleccionables y `toggleAvoidArea` permite alternarlas.
- AC2: PASS — `saveMovePreferences` mantiene el mismo almacenamiento y `sanitizeMovePreferences` usa `[]` para datos legacy y descarta valores desconocidos.
- AC3: PASS — `moveExerciseCompatible` rechaza intersecciones con `avoidAreas`; `routineForDuration` pasa todas las selecciones por esa lógica.
- AC4: PASS — `previewForDuration` deriva directamente de `routineForDuration`.
- AC5: PASS — `alternateExercise` usa `compatibleExercise`, que aplica `moveExerciseCompatible`.
- AC6: PASS — fallback ordenado (`heel-raise`, `calf-release`, `breathing`) valida compatibilidad antes de seleccionar; regresión de todas las zonas pasa.
- AC7: PASS — Quality completo del PR #67 pasó; los tests anteriores de duración/equipamiento siguen verdes y no se modificó runtime de pausa/progreso/feedback/sesiones.
- AC8: PASS — `move-adaptation.test.ts` cubre rodillas, hombros/muñecas, todas las zonas y sanitización legacy.
- AC9: PASS — `app.json` = 0.3.11/versionCode 67, `package.json` = 0.3.11 y `CHANGELOG-0.3.11.md` documenta MOV-11.

Evidence: GitHub Actions Quality run #87 — typecheck and regression tests SUCCESS.
