# WF-QA-003 — Focus estable para todos los campos de texto

Status: VERIFYING
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

- AC1–AC4: BLOCKED for final physical-device acceptance. Code review confirms all four focus-driven scroll callbacks and obsolete refs are removed; device interaction must still verify focus/visibility with the keyboard open.
- AC5: PASS — ImportantEventCard no longer accepts or invokes onTitleFocus; local regression passed.
- AC6: PASS by code inspection — Food, Semana, TimeEditModal and MoveHome retain KeyboardAvoidingView, handled taps and on-drag dismissal; app.json retains Android resize. Explicit modal Save/Cancel still dismiss the keyboard.
- AC7: PASS — global regression scans 12 TSX files with TextInput; also searched app/src for onFocus, scrollToEnd, blur and Keyboard.dismiss. Only explicit TimeEditModal Save/Cancel dismissals remain.
- AC8: PASS — Quality #194, run 36094821035, exact source a1417ae; TypeScript and full regression suite passed. Both keyboard regressions also passed locally on 2026-09-25.
- AC9: PENDING — signed Android 0.4.2 release after merge.
- Persistence/regression review: PASS — PR changes are limited to focus callbacks/refs, tests, release metadata and documentation. No database, records, account or scheduling logic changed.

### Physical verification checklist
On Android, focus and type in Food pantry/manual entry, Semana important-event title, both time-correction fields and the Move feedback note. Confirm the caret stays in the field, no jump to screen bottom, text remains visible, drag dismisses the keyboard and Save/Cancel still work. Repeat with existing saved data after updating the signed APK.
