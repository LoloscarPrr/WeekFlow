# WF-WEEK-001 — Editar momentos importantes sin borrarlos

Status: VERIFYING
Owner: WeekFlow

## Problem
En la pantalla Semana, un momento importante guardado solo ofrece la acción `Eliminar`. Corregir su nombre, fecha u hora obliga a destruir el registro y crearlo de nuevo, lo que añade fricción y riesgo de pérdida. La grabación Android suministrada reproduce este recorrido con `Dentista`.

## Desired behavior
Cada momento guardado debe ofrecer `Editar`. Al elegirlo, el formulario se rellena con el mismo registro; guardar reemplaza sus valores sin crear un duplicado y el cambio queda disponible para Semana, Ahora y los recordatorios.

## Scope
- Añadir un modo de edición al formulario de momentos importantes de `WeekRitualCard`.
- Precargar nombre, fecha y hora del momento elegido.
- Guardar la edición reutilizando su ID existente.
- Permitir cancelar la edición sin cambiar los datos guardados.
- Mantener el formulario coherente si se elimina el momento que se estaba editando.
- Añadir cobertura de regresión para reemplazo, identidad, orden y cierre del Ritual.
- Publicar la corrección como WeekFlow Alpha 0.3.15.

## Non-goals
- Cambiar el modelo de datos o la base SQLite.
- Rediseñar la captura manual de fecha/hora o introducir nuevos selectores.
- Cambiar la lógica de notificaciones, Ahora o del Brain.
- Añadir recurrencia, notas, categorías o nuevas propiedades a los momentos.

## Acceptance criteria
- [ ] AC1 — Cada momento listado ofrece una acción visible `Editar` además de `Eliminar`.
- [ ] AC2 — `Editar` carga en el formulario el nombre, la fecha y la hora actuales del registro.
- [ ] AC3 — Guardar una edición conserva el ID, reemplaza los valores y no duplica el momento.
- [ ] AC4 — La edición conserva validaciones actuales y vuelve a ordenar por fecha/hora cuando corresponde.
- [ ] AC5 — `Cancelar edición` abandona el borrador sin modificar el momento persistido.
- [ ] AC6 — Eliminar el momento que se está editando limpia el modo de edición de forma segura.
- [ ] AC7 — Crear y eliminar momentos nuevos sigue funcionando como antes.
- [ ] AC8 — Cerrar el Ritual conserva el momento editado para los consumidores de la semana.
- [ ] AC9 — Typecheck y regresiones automatizadas pasan.
- [ ] AC10 — Versión y changelog quedan actualizados a 0.3.15 y el build Android firmado pasa.

## Data / persistence impact
Sin migración. `ImportantMoment` no cambia; `upsertImportantMoment` ya reemplaza por ID y `saveWeekState` conserva el resultado en SQLite.

## UI / UX impact
Los registros muestran `Editar` y `Eliminar`. Durante la edición, el formulario comunica qué momento se corrige, cambia la acción principal a `Guardar cambios` y ofrece `Cancelar edición`.

## Edge cases / regressions
- Editar la fecha puede cambiar el día derivado y la posición cronológica.
- Una edición inválida no debe sobrescribir el registro válido.
- Editar repetidamente el mismo ID nunca debe crear copias.
- Cancelar no debe cerrar ni reabrir el Ritual por sí solo.
- Crear un momento después de cancelar debe generar un ID nuevo.
- El momento editado debe sobrevivir a `completeWeekRitual`.
- Verificar que Ahora y recordatorios sigan consumiendo el mismo arreglo `importantMoments`.

## Verification plan
- Extender `tests/regression.test.ts` con reemplazo por ID, actualización de fecha/hora/día, ausencia de duplicado y conservación tras cerrar el Ritual.
- Ejecutar `npm run quality` localmente.
- Revisar el diff para confirmar ausencia de migraciones y cambios fuera de Semana/tests/spec.
- Ejecutar Quality en el PR.
- Generar el APK firmado después del merge; la validación táctil final queda para dispositivo Android.

## Verification record
- AC1–AC2: IMPLEMENTED — cada fila expone `Editar` y precarga el formulario desde el `ImportantMoment` seleccionado.
- AC3–AC4: IMPLEMENTED — el guardado reutiliza `editingMomentId`; la regresión comprueba reemplazo, identidad, fecha, hora, día derivado y ausencia de duplicado.
- AC5–AC6: IMPLEMENTED — cancelar limpia solo el borrador local; eliminar el registro activo también abandona el modo de edición.
- AC7–AC8: IMPLEMENTED — creación/eliminación mantienen los caminos existentes y la regresión comprueba conservación tras `completeWeekRitual`.
- AC9: PENDING CI — el entorno local no pudo instalar dependencias porque el registro npm no está disponible ni cacheado.
- AC10: PENDING CI/BUILD — metadatos y changelog 0.3.15 implementados; falta verificar Quality y el build Android firmado.
- Persistence/migration: PASS BY INSPECTION — no cambian entidades, repositorios, SQLite ni migraciones.
- Device interaction: BLOCKED hasta instalar y probar el APK resultante en Android.
