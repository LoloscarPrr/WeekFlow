# WF-HABIT-002 — Campo de mini-versión legible

Status: LOCKED

## Problem
En la build 0.5.0, el placeholder largo del campo de mini-versión (`Mini-versión opcional · Ej. leer 2 páginas`) puede saltar a una segunda línea en Android y quedar recortado dentro del input de altura fija. El defecto fue observado físicamente en teléfono real.

## Desired behavior
El campo mantiene la misma función, pero la condición “opcional” se presenta como etiqueta separada y el placeholder queda corto. La UI debe seguir siendo clara con pantallas angostas y tamaños de texto mayores sin invadir `Frecuencia flexible`.

## Scope
- Ajustar solamente la presentación del campo de mini-versión en Jardín.
- Añadir etiqueta visible `Mini-versión (opcional)`.
- Usar placeholder corto `Ej. leer 2 páginas`.
- Mantener valor, persistencia, maxLength y comportamiento de edición existentes.
- Añadir regresión estructural para impedir volver al placeholder largo.

## Non-goals
- No cambiar el modelo de hábitos.
- No cambiar frecuencia, completions, mini/full, undo ni persistencia.
- No implementar reprogramación todavía.
- No cambiar otros módulos.

## Acceptance criteria
- [ ] AC1 — El formulario muestra la etiqueta `Mini-versión (opcional)` fuera del TextInput.
- [ ] AC2 — El placeholder del input es `Ej. leer 2 páginas` y ya no contiene la etiqueta completa.
- [ ] AC3 — `Frecuencia flexible` queda como bloque separado debajo del input.
- [ ] AC4 — Se conservan `maxLength={120}`, keyboard-aware scroll y persistencia sin cambios.
- [ ] AC5 — Regresión estructural cubre etiqueta + placeholder corto y rechaza el placeholder anterior.
- [ ] AC6 — Quality y Android release pasan como WeekFlow 0.5.1.

## Data / persistence impact
Ninguno.

## UI / UX impact
Cambio visual mínimo dentro del formulario de Jardín.

## Verification plan
- Test estructural de `app/garden.tsx`.
- `npm run quality` en PR.
- Android firmado en `main`.
- Prueba visual final en teléfono real.

Spec: WF-HABIT-002
