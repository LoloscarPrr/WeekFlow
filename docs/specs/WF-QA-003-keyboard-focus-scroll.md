# WF-QA-003 — Focus estable para todos los campos de texto

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 25-09-2026
Source: validación física Android de WeekFlow 0.4.1

## Problem

Food y Evento importante demostraron un patrón defectuoso: algunos formularios usaban el evento de focus para llamar `scrollToEnd()`, mandando la pantalla al fondo. La misma técnica también estaba presente en Corregir hora y en el comentario de feedback de Move. Este comportamiento debe quedar prohibido transversalmente.

## Desired behavior

- Cualquier TextInput de WeekFlow conserva su focus natural mientras la persona escribe.
- Enfocar un TextInput no puede disparar scroll al inicio/final de una pantalla.
- La interfaz puede reajustarse por KeyboardAvoidingView / resize nativo, pero solo lo necesario para el teclado.
- No se ejecuta blur ni cierre programático del teclado por el mero hecho de enfocar un campo.
- Acciones explícitas como Guardar, Cancelar o cerrar un modal sí pueden cerrar el teclado.
- Arrastrar una pantalla con `keyboardDismissMode="on-drag"` sigue permitiendo cerrar el teclado manualmente.

## Scope

- Eliminar focus-driven `scrollToEnd()` de Food, Semana/Eventos, Corregir hora y Move Feedback.
- Eliminar callbacks/refs que existían solo para esos scrolls.
- Mantener KeyboardAvoidingView donde ya existe.
- Añadir regresión global que recorra todos los TSX con TextInput y prohíba `scrollToEnd()`/helpers de scroll conectados al focus.
- Mantener regresiones específicas de Food y Semana.
- Bump 0.4.2.

## Non-goals

- Reescribir todos los TextInput con un componente visual nuevo.
- Rediseñar formularios.
- Cambiar lógica de negocio, recordatorios, Food, Move o persistencia.
- Prohibir que Guardar/Cancelar cierren el teclado.

## Acceptance criteria

- [ ] AC1 — Food conserva focus sin salto al fondo.
- [ ] AC2 — Semana/Eventos importantes conserva focus sin salto al fondo.
- [ ] AC3 — Corregir hora conserva focus sin salto al fondo.
- [ ] AC4 — Comentario de Move conserva focus sin salto al fondo.
- [ ] AC5 — `ImportantEventCard` no recibe ni dispara `onTitleFocus`.
- [ ] AC6 — Los wrappers con teclado existentes conservan `KeyboardAvoidingView` y cierre manual por drag cuando corresponde.
- [ ] AC7 — Una regresión global revisa todos los archivos TSX que contienen TextInput y falla si vuelven a usar `scrollToEnd()` en esa vista.
- [ ] AC8 — TypeScript + regresiones pasan.
- [ ] AC9 — Android release 0.4.2 genera APK + AAB firmados.

## Verification result

- AC1–AC9: PENDING
