# WF-WEEK-002 — Registro mínimo de evento importante

Status: DONE
Owner: WeekFlow

## Problem
La pantalla Semana quedó correctamente compacta al retirar el Ritual, pero también perdió la única forma manual de registrar un compromiso que WeekFlow deba proteger. Recuperar el bloque antiguo completo volvería a introducir demasiado texto y controles irrelevantes.

## Desired behavior
Semana permite registrar un evento importante mediante un control pequeño y directo: nombre, fecha, hora y Guardar. Los eventos existentes aparecen en una lista compacta y se pueden eliminar. No reaparecen el Ritual ni sus explicaciones, resúmenes o confirmaciones.

## Scope
- Añadir a Semana una tarjeta compacta `Evento importante` después de `Importar horario`.
- Incluir un campo para el nombre, botones táctiles para fecha y hora, y una acción `Guardar`.
- Usar selectores nativos de fecha y hora en vez de exigir formatos escritos.
- Mostrar eventos guardados como filas compactas con nombre, fecha, hora y acción de eliminación.
- Restaurar en `useWeekController` solamente los callbacks de guardar y eliminar mediante los casos de uso existentes.
- Publicar el cambio como `0.3.18` con `versionCode` fuente `73`.

## Non-goals
- No restaurar `WeekRitualCard`, origen, resumen humano, cierre semanal ni segunda confirmación.
- No añadir descripción larga, categorías, recurrencia, ubicación, notas, prioridad configurable ni edición avanzada.
- No mover la captura al Asistente en esta versión.
- No cambiar el esquema SQLite, el modelo `ImportantMoment`, Ahora, notificaciones, jornadas, importación o navegación.
- No habilitar facturación ni cambiar la configuración de privacidad de 0.3.17.

## Acceptance criteria
- [x] AC1 — Semana conserva su encabezado, resumen, siete días e importación compactos, sin Ritual, origen, resumen humano ni confirmación final.
- [x] AC2 — La única UI nueva se titula `Evento importante` y contiene nombre, fecha, hora, `Guardar` y, cuando corresponda, filas de eventos guardados; no contiene párrafos explicativos.
- [x] AC3 — Fecha y hora se eligen con controles táctiles nativos y se guardan como fecha local `YYYY-MM-DD` y hora `HH:MM`, sin desfase UTC.
- [x] AC4 — Un nombre vacío no se guarda; un evento válido se persiste inmediatamente, limpia el campo de nombre y aparece ordenado en la lista.
- [x] AC5 — Cada evento mostrado puede eliminarse y la eliminación se persiste inmediatamente.
- [x] AC6 — El modelo y esquema no cambian; Ahora y notificaciones conservan sus consumidores actuales de `importantMoments`.
- [x] AC7 — La pantalla mantiene áreas táctiles de al menos 44 dp y el teclado no bloquea Guardar ni la lista inferior.
- [x] AC8 — `npm run quality` pasa, la versión fuente queda en `0.3.18` / `73` y el build Android firmado se verifica antes de cerrar la spec.

## Data / persistence impact
No hay migración ni cambio de esquema. La UI reutiliza `upsertImportantMoment` y `removeImportantMoment`; cada cambio se guarda mediante `saveWeekState`. Los eventos históricos se conservan.

## UI / UX impact
- Una tarjeta compacta al final de Semana.
- Un solo campo de texto y dos selectores nativos.
- Sin instrucciones de formato, explicación narrativa, ritual ni modal de éxito.
- Los errores se comunican con una alerta breve únicamente cuando falta el nombre.

## Edge cases / regressions
- Elegir una fecha y luego una hora conserva ambas partes del mismo instante local.
- La hora predeterminada que cruza medianoche usa también la fecha siguiente.
- Títulos con espacios se normalizan por el caso de uso existente.
- Eventos existentes de builds anteriores siguen visibles y eliminables.
- Los eventos se mantienen ordenados por fecha y hora.
- Sibling screens checked: Ahora, notificaciones e importación; no deben recibir cambios visuales ni de datos.

## Verification plan
- [x] Añadir pruebas unitarias para la fecha/hora local y el borrador predeterminado.
- [x] Revisar el árbol de Semana contra AC1–AC2 y las áreas táctiles contra AC7.
- [x] Ejecutar `npm run quality`.
- [x] Revisar el diff y confirmar ausencia de migraciones y cambios en consumidores.
- [x] Ejecutar el workflow Android, validar APK/AAB y registrar evidencia.
- [x] Abrir PR con `Spec: WF-WEEK-002` y checklist PASS/BLOCKED.

## Implementation notes
La instrucción explícita del usuario reemplaza la decisión histórica de 0.2.5 que reservaba la captura para el Asistente. El cambio conserva el objetivo de `WF-WEEK-001`: Semana sigue compacta y no recupera el Ritual.

## Verification result
- AC1: PASS — `app/week.tsx` conserva la estructura compacta de `WF-WEEK-001` y la búsqueda de copy confirma que el Ritual no volvió.
- AC2: PASS — `ImportantEventCard` renderiza solamente título, nombre, fecha, hora, Guardar y filas existentes.
- AC3: PASS — los dos botones abren `DateTimePicker`; la prueba de dominio cubre fecha, hora, reemplazo parcial y cruce de medianoche locales.
- AC4: PASS — el componente bloquea el nombre vacío, llama al caso de uso existente, limpia el campo y recibe la colección persistida ordenada.
- AC5: PASS — cada fila tiene una acción táctil de 44 dp que llama a `removeImportantMoment` y persiste el resultado.
- AC6: PASS — no hay cambios de entidad, migración, Ahora ni notificaciones; ambos consumidores existentes permanecen intactos.
- AC7: PASS — entrada y botones tienen 44 dp mínimos; Semana conserva `keyboardShouldPersistTaps="handled"`, `adjustResize` y padding inferior.
- AC8: PASS — Quality local, PR Quality 126 y main Quality 127 pasan. Android 123 publicó APK/AAB firmados `0.3.18` con `versionCode 100123`; el AAB valida con Bundletool y el APK verifica con esquema v2 y certificado SHA-256 `C9:C6:00:0D:41:66:DF:64:C5:14:00:D9:3C:0D:86:71:64:00:64:68:0E:AD:1D:B4:C5:2B:4A:65:44:8D:97:BA`.
