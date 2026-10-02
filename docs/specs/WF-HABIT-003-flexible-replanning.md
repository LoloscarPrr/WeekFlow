# WF-HABIT-003 — Reprogramación flexible sin culpa

Status: VERIFYING

## Problem
Habits ya permite frecuencia semanal, mini-versiones y registro diario, pero todavía no permite expresar una realidad común: “hoy no cabe, lo dejo para otro día”. El Blueprint Maestro v4.0 exige reprogramar cuando cambie la realidad sin convertir el hábito en una obligación rígida ni castigar una racha rota.

## Desired behavior
Un hábito pendiente puede guardar una `próxima ocasión` preferida dentro de los próximos 7 días. Esa fecha es orientativa: el usuario puede completar el hábito antes, volver a moverlo o dejarlo flexible otra vez. Reprogramar no crea estados de atraso, fallo ni deuda. Al completar el hábito, la próxima ocasión se limpia.

## Scope
- Añadir `plannedFor` opcional al hábito persistido.
- Acción `Mover`/`Cambiar día` en la tarjeta de un hábito pendiente.
- Selector inline de los próximos 7 días locales.
- Acción `Dejar flexible` para borrar la preferencia de fecha.
- Mostrar `Próxima ocasión` con lenguaje suave cuando exista una fecha futura o de hoy.
- Permitir `Hecho` y `Versión mini` aunque el hábito esté programado para un día posterior.
- Limpiar `plannedFor` cuando se registra full o mini.
- Mantener persistencia en la misma key `habits-state` sin migración SQLite.

## Non-goals
- No Brain automático ni búsqueda inteligente de huecos; eso corresponde al bloque Assistant + Brain.
- No notificaciones de hábitos.
- No calendario histórico ni drag & drop.
- No días obligatorios ni penalización por no hacer el hábito en `plannedFor`.
- No prioridad esencial/deseable/opcional en esta spec.
- No cambios a Move, Food, Rest, Semana, Smart Import, Free/Premium o firma Android.

## Acceptance criteria
- [x] AC1 — Un hábito pendiente ofrece `Mover`; si ya tiene una próxima ocasión visible, ofrece `Cambiar día`.
- [x] AC2 — El selector inline ofrece exactamente los próximos 7 días locales y no fechas pasadas.
- [x] AC3 — Elegir una fecha guarda `plannedFor` y la tarjeta muestra `Próxima ocasión` con una etiqueta humana del día.
- [x] AC4 — `plannedFor` es orientativo: `Hecho` y `Versión mini` siguen disponibles antes de esa fecha.
- [x] AC5 — `Dejar flexible` elimina `plannedFor` sin tocar frecuencia, mini-versión o historial.
- [x] AC6 — Completar full o mini limpia `plannedFor`; deshacer el completion no restaura automáticamente una fecha antigua.
- [x] AC7 — Editar nombre/frecuencia/mini-versión conserva `plannedFor`.
- [x] AC8 — Datos previos sin `plannedFor` cargan como `null`; fechas inválidas se sanea a `null`.
- [x] AC9 — Una fecha guardada que ya quedó en el pasado deja de presentarse como compromiso activo y no genera lenguaje de atraso/fallo.
- [x] AC10 — Jardín mantiene ausencia de streaks, puntajes, deuda y lenguaje punitivo; shortcuts y keyboard-aware siguen intactos.
- [ ] AC11 — Typecheck + regresiones + Android release pipeline pasan para la versión técnica 0.5.2.

## Data / persistence impact
`Habit` suma `plannedFor: string | null` en formato local `YYYY-MM-DD`. La store sigue siendo `habits-state` dentro de `SQLiteStateStore`; no se agrega tabla ni migration. La sanitización es retrocompatible con hábitos 0.5.0/0.5.1.

## UI / UX impact
Cada tarjeta pendiente mantiene primero las acciones de cumplimiento. Debajo aparece una acción secundaria `Mover` o `Cambiar día`. Al abrirla se muestran chips para los próximos siete días. Si existe una próxima ocasión, se muestra como referencia suave y aparece `Dejar flexible`.

## Edge cases / regressions
- Reprogramar a una fecha pasada se rechaza en dominio.
- Reprogramar dos veces reemplaza la fecha previa.
- Completar antes de la fecha planeada es válido y limpia el plan.
- Un `plannedFor` viejo/pasado no se muestra como atraso.
- Editar un hábito no borra la próxima ocasión.
- Un hábito sin mini-versión sigue reprogramándose igual.
- Cambio de día local se resuelve por date-key local, no UTC.

## Verification plan
- [x] Extender `habits-core.test.ts` con replan, rechazo de pasado, clear, edit-preserves-plan y completion-clears-plan.
- [x] Extender la regresión estructural de Jardín para `Mover`, `Cambiar día`, siete opciones, `Dejar flexible` y ausencia de copy punitivo.
- [ ] `npm run quality` en PR.
- [ ] Android APK/AAB firmado en `main`.
- [ ] Prueba física: crear hábito → mover a otro día → cerrar/reabrir → confirmar fecha → completar antes/ese día → comprobar que la fecha desaparece.

Spec: WF-HABIT-003
