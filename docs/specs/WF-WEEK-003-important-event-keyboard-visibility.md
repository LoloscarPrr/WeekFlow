# WF-WEEK-003 — Evento importante visible sobre el teclado

Status: DONE
Owner: WeekFlow

## Problem
En Semana, al enfocar `Nombre del evento`, el teclado de Android tapa el formulario de evento importante y la interfaz no se desplaza hasta dejar visibles el campo y la acción Guardar.

## Desired behavior
Cuando el campo recibe foco, Semana reduce el área visible para el teclado y desplaza el contenido hasta el formulario. El usuario puede ver lo que escribe y acceder a fecha, hora y Guardar sin cerrar primero el teclado.

## Scope
- Aplicar a Semana el patrón de `KeyboardAvoidingView` ya usado por Food y Move.
- Dar una referencia al scroll de Semana y desplazarlo al final cuando el nombre recibe foco.
- Permitir descartar el teclado arrastrando la pantalla.
- Publicar la corrección como `0.3.19` con `versionCode` fuente `74`.

## Non-goals
- No cambiar campos, textos, estilo, orden ni datos del evento importante.
- No modificar horario, selectores nativos, persistencia, Ahora, notificaciones ni navegación.
- No introducir una dependencia nueva ni un formulario/modal adicional.

## Acceptance criteria
- [x] AC1 — Al enfocar `Nombre del evento`, Semana desplaza el formulario después de que aparece el teclado.
- [x] AC2 — El campo, los controles de fecha y hora y Guardar quedan alcanzables con el teclado abierto en Android.
- [x] AC3 — Arrastrar Semana puede cerrar el teclado y la barra inferior continúa ocultándose mientras el teclado está visible.
- [x] AC4 — Guardar desde la tecla de acción o desde el botón conserva el comportamiento de 0.3.18.
- [x] AC5 — La edición de jornadas y los selectores de fecha/hora mantienen su comportamiento.
- [x] AC6 — Food, Move y los modales con teclado no cambian.
- [x] AC7 — TypeScript y todas las regresiones existentes pasan; no hay cambios de esquema ni migraciones.
- [x] AC8 — La fuente queda en `0.3.19` / `74` y el build Android firmado se verifica antes de cerrar la spec.

## Data / persistence impact
Ninguno. No cambian entidades, casos de uso, repositorios, SQLite ni migraciones.

## UI / UX impact
Semana gana solamente comportamiento de evitación y desplazamiento frente al teclado. La composición visual permanece igual cuando el teclado está cerrado.

## Edge cases / regressions
- El desplazamiento se ejecuta después de que Android informa y aplica el tamaño del teclado.
- Una lista de eventos existente sigue siendo desplazable.
- Tocar Guardar con el teclado abierto no pierde el primer toque.
- Los selectores nativos siguen apareciendo sobre la pantalla.
- Sibling screens checked: Food, Move y TimeEditModal conservan su patrón actual.

## Verification plan
- Revisar que Semana use el mismo contenedor estable de las pantallas ya corregidas.
- Añadir una comprobación estructural que falle si se elimina el contenedor, la referencia o el callback de foco.
- Ejecutar TypeScript y todas las suites de regresión.
- Revisar el diff para confirmar que no hay cambios de datos o pantallas hermanas.
- Ejecutar el workflow Android y registrar la evidencia del APK/AAB firmado.

## Verification result
- AC1: PASS — `onFocus` llama a `keepImportantEventVisible` y el scroll se desplaza al final tras 180 ms.
- AC2: PASS — Semana usa `KeyboardAvoidingView` con `height` en Android y conserva padding inferior desplazable.
- AC3: PASS — el scroll usa `keyboardDismissMode="on-drag"`; `BottomNav` ya se oculta mediante sus listeners compartidos.
- AC4: PASS — `saveEvent`, `onSubmitEditing`, `onSave` y la persistencia no cambiaron.
- AC5: PASS — el controlador y ambos `DateTimePicker` no cambiaron.
- AC6: PASS — no hay diff en Food, Move ni TimeEditModal.
- AC7: PASS — TypeScript, 20 regresiones core y las suites OCR, Excel, Move, commercial, consent y estructura de teclado pasan.
- AC8: PASS — PR Quality y main Quality pasan; Android 124 publicó APK/AAB firmados `0.3.19` desde `db77f2f8b443c57e746a83be95014492551d418e`.
