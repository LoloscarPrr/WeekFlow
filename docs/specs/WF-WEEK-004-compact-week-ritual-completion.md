# WF-WEEK-004 — Cierre compacto del Ritual de la Semana

Status: VERIFYING
Owner: WeekFlow

## Problem
Semana ya permite editar jornadas, importar desde cámara/galería/Excel, revisar la lectura automática y registrar eventos importantes, pero el estado `organizedAt` no se cierra desde la UI actual. Después de importar o editar, no existe una acción compacta que permita decir “esta semana ya quedó bien”, por lo que el Ritual de la Semana del Blueprint v3.4 queda incompleto.

Las versiones anteriores retiraron correctamente un Ritual largo y redundante. La solución no debe devolver ese bloque pesado.

## Desired behavior
Semana conserva su diseño compacto y añade al final un cierre mínimo del Ritual. Mientras la semana esté abierta (`organizedAt === null`), muestra un resumen breve y una única acción `Listo, organizar semana`. Al pulsarla, persiste el cierre con la hora actual y sincroniza recordatorios. Cuando ya está organizada, la misma tarjeta pasa a un estado de confirmación breve: `Listo. Tu semana ya está organizada.`

Cualquier edición posterior de jornada o evento conserva el comportamiento existente: reabre la semana y vuelve a requerir cierre, sin perder datos.

## Scope
- Reutilizar `completeWeekRitual(...)` desde `useWeekController`.
- Añadir `completeRitual()` al controlador de Semana.
- Persistir `organizedAt` con un ISO válido al cerrar la semana.
- Sincronizar recordatorios después del cierre.
- Añadir una tarjeta compacta al final de Semana, después de `Evento importante`.
- Mostrar el resumen humano ya disponible: jornadas, días libres y tiempo programado.
- Mostrar una sola acción de cierre cuando la semana está abierta.
- Publicar como WeekFlow `0.4.5` / source `versionCode 87`.

## Non-goals
- No restaurar el antiguo `WeekRitualCard` largo, panel de origen, explicación narrativa extensa ni segunda pantalla de resumen.
- No cambiar OCR, detección de persona, confianza/ambigüedad ni revisión de cámara/galería.
- No cambiar Excel ni PDF ni resolver en esta spec su prioridad histórica dentro del roadmap.
- No cambiar cómo `ScheduleImportCard` guarda una importación ya revisada.
- No cambiar esquema SQLite, entidades, migraciones ni compatibilidad con datos existentes.
- No cambiar Ahora, Rest, Move, Food, Jardín, Asistente, cuenta, Free/Premium ni firma Android.

## Acceptance criteria
- [x] AC1 — Semana mantiene encabezado, resumen, siete días, `Importar horario` y `Evento importante`; el nuevo cierre aparece después de esos controles y no restaura el ritual largo anterior.
- [x] AC2 — Con `organizedAt === null`, la tarjeta muestra `RITUAL DE LA SEMANA`, un resumen con jornadas/libres/horas y exactamente una acción principal `Listo, organizar semana`.
- [x] AC3 — Pulsar la acción reutiliza `completeWeekRitual`, guarda un timestamp ISO válido y actualiza el estado visible sin navegación adicional.
- [x] AC4 — El cierre persiste con `saveWeekState` y solicita `syncLivePlanReminders` para que el plan derivado use la semana confirmada.
- [x] AC5 — Con `organizedAt` presente, la tarjeta muestra `Listo. Tu semana ya está organizada.` y no vuelve a mostrar el botón de cierre.
- [x] AC6 — Editar una jornada o un evento conserva los casos de uso existentes que reabren la semana (`organizedAt: null`); no hay migración ni pérdida de datos.
- [x] AC7 — Importación/OCR/Excel/PDF no cambian en esta spec; la revisión explícita antes de guardar sigue intacta.
- [ ] AC8 — `npm run quality`/PR Quality y build Android firmado de `main` pasan para `0.4.5` antes de marcar la spec DONE.
- [ ] AC9 — Prueba física Android confirma que el cierre es visible/tocable y que una edición posterior vuelve al estado abierto sin romper teclado, scroll ni eventos importantes.

## Data / persistence impact
No hay migración. Se usa el campo existente `WeekSchedule.organizedAt`. `completeWeekRitual` ya valida el timestamp. Los cambios manuales de jornada y eventos ya llaman a `reopenManualWeek`, por lo que continúan dejando `organizedAt: null` y preservando jornadas/eventos existentes.

## UI / UX impact
- Una tarjeta pequeña al final de Semana.
- Estado abierto: eyebrow, pregunta breve, resumen existente, una línea de ayuda y un botón.
- Estado cerrado: confirmación breve y el mismo resumen; sin botón extra.
- No se agrega modal, formulario, carrusel, explicación larga ni nueva navegación.

## Edge cases / regressions
- Siete días libres: el resumen sigue siendo válido y se puede cerrar la semana.
- Siete jornadas: el cierre sigue siendo visible al final del scroll.
- Jornada nocturna: no se recalculan horarios ni se cambia su clasificación.
- Una importación confirmada llega a Semana abierta y puede cerrarse después de revisar eventos.
- Editar hora, Trabajo/Libre, colación, crear/eliminar evento reabre la semana mediante los casos de uso actuales.
- Cerrar dos veces no es posible desde la UI porque el botón desaparece al quedar `organizedAt` persistido.
- El teclado y la barra inferior conservan el comportamiento de 0.4.4.

## Verification plan
- Añadir regresión estructural para comprobar que Semana conecta `completeRitual`, `organizedAt` y el copy compacto esperado.
- Reutilizar la regresión existente de `completeWeekRitual` para timestamp/persistencia lógica.
- Ejecutar PR Quality.
- Revisar diff y confirmar que no cambian import parsers, entidades ni migraciones.
- Fusionar solo con Quality verde y comprobar Quality + Android firmado en `main`.
- Validar físicamente el flujo abierto → cerrado → editar → abierto.

## Verification result
- AC1–AC7: PASS por inspección de implementación y regresiones estructurales incluidas en la rama.
- AC8: PENDING — se verifica mediante GitHub Actions después de publicar la rama/PR.
- AC9: PENDING — requiere prueba física en Android con el APK generado.

Spec: WF-WEEK-004
