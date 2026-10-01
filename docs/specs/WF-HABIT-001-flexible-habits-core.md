# WF-HABIT-001 — Núcleo de hábitos flexibles

Status: VERIFYING

## Problem
Jardín existe como superficie visual, pero WeekFlow todavía no permite crear ni ejecutar hábitos. El Blueprint v4.0 exige que los hábitos sobrevivan semanas variables sin culpa, evitando streaks punitivos y permitiendo versiones mínimas en días difíciles.

## Desired behavior
El usuario puede crear y editar hábitos con una frecuencia semanal flexible y una mini-versión opcional. Cada día puede registrar el hábito completo o su mini-versión, deshacer el registro y cerrar/reabrir la app sin perder el estado. Jardín representa el hábito sin puntajes, rachas ni lenguaje de fracaso.

## Scope
- Modelo local de hábitos y completions.
- Frecuencia flexible expresada como objetivo de veces por semana, sin días rígidos.
- Mini-versión opcional por hábito.
- Crear y editar hábitos desde Jardín.
- Registrar hoy como `full` o `mini`.
- Un solo registro por hábito/día; cambiar full ↔ mini reemplaza el registro del día.
- Deshacer el registro de hoy.
- Persistencia en el `SQLiteStateStore` existente.
- Mantener los accesos actuales de Jardín a Rest, Food y Semana.

## Non-goals
- No implementar reprogramación por días concretos todavía.
- No notificaciones de hábitos en esta spec.
- No IA/Brain, recomendaciones automáticas ni Smart Import.
- No streaks, puntos, niveles, castigos ni celebraciones competitivas.
- No calendario histórico completo ni estadísticas avanzadas.
- No cambiar Free/Premium ni entitlements.
- No migración de esquema SQLite si la store key-value existente basta.

## Acceptance criteria
- [x] AC1 — Con cero hábitos, Jardín muestra un estado explicativo y un formulario usable para crear el primero. PASS: empty state + formulario en `app/garden.tsx`.
- [x] AC2 — Crear un hábito requiere nombre y permite frecuencia flexible `1–7 veces por semana` y mini-versión opcional. PASS: UI + saneamiento en `src/habits/core.ts`.
- [x] AC3 — Un hábito existente puede editar nombre, frecuencia y mini-versión sin perder sus registros previos. PASS: `upsertHabit` conserva id/completions; regresión dedicada.
- [x] AC4 — Un hábito pendiente hoy permite marcar `Hecho`; si tiene mini-versión, también permite `Versión mini`. PASS: acciones visibles en Jardín.
- [x] AC5 — Full y mini cuentan como cumplimiento válido del día y nunca generan más de un registro por hábito/día. PASS: `completeHabit` reemplaza por habitId+fecha; regresión dedicada.
- [x] AC6 — El registro de hoy puede deshacerse y el hábito vuelve a estado pendiente sin penalización visual o textual. PASS: `undoHabitCompletion` + acción `Deshacer`.
- [x] AC7 — Hábitos y registros sobreviven reinicios mediante `SQLiteStateStore`; no hay migración de base de datos. PASS estructural: key `habits-state`, read/write sobre store existente, sin migration.
- [x] AC8 — Jardín no muestra streaks, puntos, porcentajes de fracaso ni textos como “fallaste/perdiste”. PASS: regresión estructural.
- [x] AC9 — Los accesos existentes de Jardín a Descanso, Alimentación y Semana siguen disponibles. PASS: regresión estructural.
- [x] AC10 — Inputs y acciones permanecen utilizables con teclado/safe area/bottom nav usando la infraestructura keyboard-aware existente. PASS estructural: shared `KeyboardAwareScrollView` + `KeyboardAwareTextInput`; pendiente confirmación física.
- [ ] AC11 — Typecheck + regresiones + Android release pipeline pasan en la versión técnica 0.5.0. PR Quality #222 PASS; Android `main` pendiente.

## Data / persistence impact
Nueva key `habits-state` en `SQLiteStateStore`, con:
- `habits[]`: id, nombre, mini-versión, target semanal, timestamps y estado activo.
- `completions[]`: habitId, fecha local, modo `full|mini`, timestamp.

No se agrega tabla ni migration; datos actuales quedan intactos.

## UI / UX impact
Jardín mantiene su identidad “Equilibrio sin puntajes” y suma una sección `HÁBITOS FLEXIBLES` antes de los accesos de áreas. El formulario es compacto. Un hábito completado hoy muestra su estado y ofrece `Deshacer`; uno pendiente ofrece `Hecho` y, cuando corresponda, `Versión mini`.

## Edge cases / regressions
- Nombre vacío no crea/actualiza.
- Frecuencia inválida se sanea a rango 1–7.
- Datos persistidos corruptos o parciales no rompen Jardín.
- Dos taps full/mini el mismo día reemplazan el registro, no lo duplican.
- Editar un hábito conserva completions por id.
- Cambiar de día local no arrastra el estado “hecho hoy”.
- Los shortcuts existentes siguen navegables.

## Verification plan
- [x] Pruebas puras para sanitización, create/update, full/mini único por día, undo y conteo semanal.
- [x] Regresión estructural de Jardín para keyboard-aware, ausencia de streaks/puntajes y presencia de shortcuts.
- [x] `npm run quality` en PR — Quality #222 PASS.
- [ ] Android release signed APK/AAB en `main`.
- [ ] Prueba física final: crear → completar mini/full → deshacer → editar → cerrar/reabrir app y comprobar persistencia.

Spec: WF-HABIT-001
