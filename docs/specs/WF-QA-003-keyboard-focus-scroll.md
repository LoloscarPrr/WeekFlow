# WF-QA-003 — Foco de teclado sin salto al fondo

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 25-09-2026
Source: validación física Android de WeekFlow 0.4.1

## Problem

Al enfocar campos de texto en Food y en Evento importante, la pantalla llama manualmente a `scrollToEnd()`. Eso manda la vista al fondo de la pantalla en vez de mantener estable el contexto alrededor del campo que se está editando.

## Desired behavior

- Enfocar un campo de Food no desplaza la pantalla al fondo y el TextInput conserva el focus mientras la persona escribe.
- Enfocar el nombre de un evento importante no desplaza Semana al fondo y el campo conserva el focus mientras la persona escribe.
- KeyboardAvoidingView y el ajuste nativo de Android siguen encargándose de dejar espacio al teclado.
- Arrastrar la pantalla con el teclado abierto sigue permitiendo cerrarlo.
- No se cambia lógica de Food, recordatorios ni persistencia.

## Scope

- Eliminar `scrollToEnd()` y callbacks de foco asociados en `app/food.tsx` y `app/week.tsx`.
- Simplificar props de `ImportantEventCard` eliminando `onTitleFocus`.
- Mantener el focus natural del TextInput; no introducir `blur()` ni cierre programático del teclado al enfocarlo.
- Actualizar regresiones estructurales para prohibir `scrollToEnd()` forzado en estos formularios.
- Añadir cobertura estructural para Food.
- Bump 0.4.2.

## Non-goals

- Rediseñar formularios.
- Cambiar KeyboardAvoidingView global.
- Cambiar notificaciones o lógica de recordatorios.
- Cambiar contenido de Food/Prep.

## Acceptance criteria

- [ ] AC1 — Food no contiene `scrollToEnd()` asociado al foco de inputs y no dispara blur/dismiss al enfocarlos.
- [ ] AC2 — Semana/Eventos importantes no contiene `scrollToEnd()` asociado al foco y no dispara blur/dismiss al enfocarlos.
- [ ] AC3 — `ImportantEventCard` ya no recibe ni dispara `onTitleFocus`.
- [ ] AC4 — Food y Semana conservan `KeyboardAvoidingView`.
- [ ] AC5 — Ambos conservan `keyboardDismissMode="on-drag"`.
- [ ] AC6 — TypeScript + regresiones pasan.
- [ ] AC7 — Android release 0.4.2 genera APK + AAB firmados.

## Verification result

- AC1–AC7: PENDING
