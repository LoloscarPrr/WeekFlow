# WF-QA-002 — Limpiar ajustes de Move y edición de nombre

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 20-09-2026
Source: validación física Android de WeekFlow Alpha v0.3.25

## Problem

La prueba física muestra dos problemas de UX:

1. En la tarjeta principal de Move aparece un bloque "Ajustes de hoy" (Silla, Suelo, Bajo impacto y Evitar hoy) que ocupa espacio y distrae de las decisiones principales de la sesión.
2. En Cuenta WeekFlow, cuando la cuenta ya tiene nombre guardado y visible junto al correo, aparece igualmente un formulario permanente "Tu nombre" con botón "Guardar nombre", lo que parece pedir guardar un dato que ya está guardado.

## Desired behavior

- La pantalla principal de Move no muestra el bloque "Ajustes de hoy" ni "Evitar hoy".
- Las mismas preferencias siguen disponibles dentro de "Editar perfil" para no perder funcionalidad.
- Cuenta WeekFlow muestra nombre y correo como información guardada.
- La edición de nombre solo aparece bajo demanda al tocar "Editar nombre".
- Guardar un nombre cierra el editor y actualiza la cabecera.
- Cancelar edición no cambia el nombre guardado.

## Scope

- Reubicar Silla, Suelo, Bajo impacto y zonas a evitar dentro del panel Perfil base → Editar.
- Eliminar el bloque duplicado de la vista principal de Move.
- Colapsar la edición de nombre de Cuenta WeekFlow.
- Añadir acción Editar nombre y Cancelar.
- Bump 0.3.26.
- Quality + Android release.

## Non-goals

- No cambiar la lógica adaptativa de Move.
- No eliminar las restricciones del modelo/persistencia.
- No cambiar Firebase Auth.
- No cambiar sincronización ni datos locales.
- No modificar Biblioteca Move ni el generador estructurado.

## Acceptance criteria

- [ ] AC1 — "Ajustes de hoy" y "Evitar hoy" ya no aparecen en la vista principal de Move.
- [ ] AC2 — Silla, Suelo, Bajo impacto y zonas evitadas siguen editables dentro de Perfil base → Editar.
- [ ] AC3 — Las preferencias existentes siguen persistiendo sin migración.
- [ ] AC4 — Cuenta no muestra por defecto un formulario "Tu nombre" para una cuenta autenticada.
- [ ] AC5 — La cabecera autenticada ofrece una acción explícita "Editar nombre".
- [ ] AC6 — Editar nombre abre el campo y Guardar actualiza Firebase + perfil local y cierra el editor.
- [ ] AC7 — Cancelar restaura el nombre actual y cierra el editor sin guardar.
- [ ] AC8 — Quality/TypeScript/regresiones pasan.
- [ ] AC9 — Android release 0.3.26 genera APK + AAB firmados.

## Verification result

- AC1–AC9: PENDING
