# WF-SMART-004 — Revisión concentrada en cambios y dudas

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-10-25
Product: WeekFlow Blueprint Maestro v4.0, §15 Smart Import

## Problem
Aunque Smart Import valida el formato y requiere confirmación, al leer foto, Excel o PDF muestra siete formularios completos, incluyendo días libres y jornadas idénticas a la Semana ya guardada. En un teléfono pequeño repetir siete entradas/colaciones/salidas es trabajo excesivo; además la pantalla permite pulsar confirmar un día libre con `issue` activo, aunque Brain lo rechaza al guardar. El usuario pide avances prácticos sin micropruebas.

## Desired behavior
Vista compacta que compara la propuesta contra Semana vigente: los siete días siguen visibles con resumen, etiqueta «Cambió», «Sin cambios» o «Revisar», y solo los días inciertos abren campos automáticamente. Cada día se puede expandir para corregir, incluso «LIBRE». Todas las correcciones de una fecha pasan la validación del Brain y el botón de confirmación solo se habilita si los siete días y la identidad son válidos. La confirmación y el deshacer siguen siendo los existentes, nunca hay autoimportación.

## Roadmap fit
Phase decision: NOW.
Reason: Blueprint 0.8.x «revisión mínima: usuario corrige solo lo dudoso» y «no repetir lo que WeekFlow ya sabe». IA visual 0.8.3 construida pero NO LIVE; esta mejora aporta valor inmediato sin activar Supabase ni enviar datos.

## Scope
- Exportar validación de jornada desde `src/brain/smartImport.ts` y reutilizarla en helper puro `src/import/reviewSummary.ts`, sin duplicar reglas.
- Comparar únicamente campos canónicos del día (off/start/end/breakMinutes), no `sourceText` ni metadatos de OCR. Los cambios «LIBRE ↔ trabajo», turnos nocturnos y colación 0 son explícitos.
- Vista de siete días resumidos en foto/cámara/Excel y PDF, con indicadores de cambios, pendientes, sin cambios, recuento total y opción «Editar» individual.
- Abrir automáticamente días dudosos; edición individual de días seguros sin entrar en otra pantalla. El usuario puede abrir todos y cerrar todos los que no requieren atención.
- Cuando el usuario corrige, actualizar estado de revisión; un día dudoso deja de serlo solo tras corrección válida.
- Bloquear confirmación si hay cualquier `issue`, confianza baja o contradicción, incluidos días libres, o si no hay siete fechas distintas/identidad validada.
- `confirmReviewedImport` + undo Brain son inalterados; ninguna migración SQLite/alteración a horarios/compromisos.
- Versión técnica 0.5.22, Android source versionCode 114, mismo paquete/firma; Quality+signed Android gate, QA física por lotes.

## Non-goals
- No activar servidor Supabase/consumo IA, ni suponer autorización para subir turnos de compañeros.
- No cambiar algoritmos OCR, PDF, Excel o respuesta de visión; no crear nuevas tablas ni duplicar plan semanal.
- No ocultar un día del resumen; todos los siete siguen visibles antes de confirmar.
- No modificar claves de notificaciones, Move/Rest/Food, ni forma de deshacer.

## Acceptance criteria
1. Helper de resumen clasifica siete jornadas, diferencia entre Semana guardada y propuesta (incluyendo libre, 00:00, medianoche, colación) y no confunde fuente/confianza con cambio de horario.
2. «Revisar» aparece por `issue`, confianza baja, hora/colación inválida, día libre contradictorio, y deja confirmación bloqueada.
3. Vista compacta muestra los siete días, estado y horas propuestas, sin siete formularios desplegados; días dudosos se expanden automáticamente.
4. Se puede abrir cualquiera de los siete días, corregir horas/colación o alternar libre, cerrar los válidos y volver a ver su resumen.
5. Foto/cámara/Excel y PDF comparten helper y reglas; no se duplica validación ni persistencia.
6. Ningún import cambia datos sin tocar «Confirmar semana»; `undoReviewedImport` y protección ante conflictos se mantienen; el botón no se habilita hasta que todos los días estén válidos.
7. Las pruebas de parser, Brain/Now/Move/Food, Android y accesibilidad no retroceden; CI Quality PASS, release Android firmado PASS o PENDING explícito.
8. Sin dependencia del backend multimodal: con Supabase inactivo, esta UX funciona con OCR local/Excel/PDF.

## Data/UI impact
No schema/persistence changes. `ReviewShift` and `WeekSchedule` unchanged. Solo helper puro y vista de revisión existente, con controles accesibles.

## Edge cases
Días duplicados/no siete, off con horas, horas inválidas, colación faltante, 00:00 en laborable, cambio solo colación, cruce 22–06, edición local del usuario antes de confirmar, cambio externo en Semana desde lectura (se mantiene conflicto en Brain).

## Verification (2026-10-25)
- AC1: PASS — `smart-import-focused-review.test.ts` comprueba siete días ordenados, libre ↔ trabajo, 22:00–06:00, y diferencia solo colación 0/30; `sourceText` y confianza no se confunden con un cambio de turno.
- AC2: PASS — misma prueba verifica entrada inválida, colación desconocida, confianza baja, libre contradictorio y fecha duplicada, todo bloquea confirmación mediante el mismo `validateSmartImportShift`.
- AC3: PASS por estructura — ambos componentes mantienen los siete resúmenes visibles y solo muestran editores en días pendientes/abiertos. QA visual física PENDING.
- AC4: PASS por estructura — controles de edición individual, libre y colación, «Editar todos»/«Ocultar listos». QA interacción física PENDING.
- AC5: PASS — ambas pantallas consumen `summarizeWeekReview` y `validateSmartImportShift`, sin duplicar Brain/SQLite.
- AC6: PASS — único flujo de `confirmReviewedImport`, `undoReviewedImport`, validación de 7 días; pruebas anteriores de transacción, undo/conflicto y notificaciones permanecen verdes.
- AC7: Quality PR #40212701598 PASS, incluyendo TypeScript, OCR/PDF/Excel, visión no LIVE, Brain y nueva regresión. Android firmado de main PENDING hasta build posterior al merge; QA física agrupada NOT RUN.
- AC8: PASS por arquitectura — mejora local independiente de Supabase, OCR ML Kit/Excel/PDF siguen disponibles sin red.
- No migración SQLite, sin permisos nuevos, fuente `com.weekflow.app` y firma existentes.

