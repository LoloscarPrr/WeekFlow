# WF-NOTIFY-010 — Silencio Inteligente con semanas reales

Status: VERIFYING
Owner: WeekFlow
Date: 2026-11-19
Blueprint: WeekFlow Maestro v4.0
Base: main @ cee59aa5b73610377537d570eb7aa98573215fcd

## Problem
`buildProtectedRestWindows` recorre desde ayer hasta dentro de 14 días, pero obtiene **todos** los turnos desde `loadWeekState()` (semana actual). Con dos horarios semanales independientes ya implementados, la app puede repetir implícitamente el domingo actual hacia la semana siguiente o perder una noche real de la semana previa. Eso altera qué avisos secundarios se silencian y lo que se informa como "próximo descanso protegido".

## Desired behavior
Para cada fecha evaluada, Smart Silence debe usar `loadWeekStateForDate(date)`, la fuente canónica de Semana (anterior/current/siguiente), sin repetir turnos de una semana en otra. Los recordatorios de Move, Food y Hábitos se silencian **solo** dentro del descanso protegido real según la semana seleccionada. Permisos, recordatorios prioritarios y preferencias existentes no cambian.

## Roadmap fit
- Phase decision: NOW
- Reason: cierre de coherencia entre Semana, Rest y notificaciones en fase de consolidación; Blueprint exige preservar sueño y no inventar turnos tras cambios reales.

## Scope
- Añadir resolvedor opcional de horario por fecha a las funciones puras `buildProtectedRestWindows` y `nextProtectedRestWindow`, sin sustituir firmas existentes de llamadas legacy.
- Usar `loadWeekStateForDate` como resolvedor en ambas rutas de `src/services/notifications.ts` y en la etiqueta de `app/notifications.tsx`.
- Crear pruebas puras y estructurales de rosters independientes y límites de semana.
- Versionado de parche Android Alpha `0.5.40` (app/package/lock/test); conservar firma e identificador.
- No revisar horarios importados ni abrir nuevas pantallas.

## Non-goals
- No cambios al motor nativo DATE/Doze, permisos exactos, canales, alarmas diagnósticas 5s/24h, estado SQLite ni programación de turnos.
- No se promete puntualidad en Android sin validación física.
- No silenciamiento de `important`, `departure`, `rest`: prioridades explícitas siguen pasando.
- No ajustes de UI visual salvo usar hora real correcta de la ventana informada.

## Acceptance criteria
- [x] AC1: domingo nocturno de la semana anterior protege la recuperación del lunes, aunque la semana actual tenga domingo libre.
- [x] AC2: turno futuro de la siguiente semana produce ventanas propias; los turnos de esta semana no se repiten en una siguiente semana no preparada.
- [x] AC3: las ventanas se ordenan y Smart Silence conserva su regla de permitir avisos prioritarios, silenciar secundarios dentro de descanso y permitir avisos fuera.
- [x] AC4: sincronización real, programación individual y etiqueta de configuración usan fuente canónica por fecha; sin consultas al historial paralelo.
- [x] AC5: firmas de la API legacy sin resolvedor y resto de pruebas existentes siguen funcionando; ningún cambio SQLite ni consentimiento.
- [x] AC6: package/app/lock/test alineados a `0.5.40`, paquete `com.weekflow.app` y versionCode CI monotónico.
- [ ] AC7: Quality incluyendo TypeScript, regresiones y Metro Android PASS; compilación firmada Android PASS o motivo explícito de bloqueo.
- [ ] AC8: prueba física de funcionamiento con semanas cambiantes y recepción 24h/48h en Redmi, BLOCKED hasta prueba real.

## Data / persistence impact
Ninguno: se consultan horarios ya persistidos mediante API canónica. No se modifica el contenido ni estructura de SQLite. No se generan nuevos recordatorios por defecto.

## UI / UX impact
El texto "Próximo descanso protegido" refleja el horario verdadero de la semana correspondiente; no cambia el diseño. Un aviso secundario podrá llegar si antes estaba suprimido por un turno *inventado* de otra semana, o se suprimirá si coincide con un descanso real antes omitido.

## Edge cases and regression
- Semana preparada con horarios distintos; siguiente semana ausente.
- Domingo anterior nocturno tras rollover; eventos prioritarios durante la ventana.
- Horarios nocturnos con fin después de medianoche.
- Sin `previousWeek`, no inferir jornada del pasado.
- Pantalla de Notificaciones, `scheduleReminder`, `syncLivePlanReminders` llaman al motor compartido.
- Rendimiento: resolver solo fechas de ventana solicitada; no crear estados secundarios.

## Verification plan
- [x] Pruebas puras en `tests/smart-silence.test.ts`.
- [x] Prueba estructural de servicios/UI en `tests/smart-silence-structure.test.cjs`.
- [ ] Quality PR, Android signed build tras merge.
- [ ] Registro de PASS/BLOCKED por criterio, incluyendo QA física.
- [x] Changelog de revisión y metadata sincronizada.

## Verification result
- AC1: **PASS (automatizado)** — caso de noche de domingo anterior protege lunes; 'move' se silencia en recuperación y prioridad 'important' pasa.
- AC2: **PASS (automatizado)** — horario del lunes siguiente se consulta cuando existe y queda vacío sin semana preparada; no inventa turnos.
- AC3: **PASS (automatizado)** — ventanas en orden, decisiones de silencio y excepciones originales sin regresión.
- AC4: **PASS (estructural)** — `scheduleReminder`, `performLivePlanReminderSync` y la tarjeta Notificaciones pasan `loadWeekStateForDate`.
- AC5: **PASS (diff/CI)** — sin cambios en SQLite, esquema, preferencias, prioridad, permisos ni lógica de programación nativa. API legacy sigue admitida.
- AC6: **PASS (CI)** — app/package/lock/test muestran `0.5.40`; package Android `com.weekflow.app`; firmante y versionCode monotónico conservados en workflow.
- AC7: **PASS Quality PR** — ejecución #44644569670: TypeScript, toda la suite de regresión y Metro Android. **Signed release: PENDING** hasta integrar en main.
- AC8: **BLOCKED** — entregar notificación durante 24/48 horas, reposo/reinicio y cambio de turnos requiere el dispositivo físico Redmi; no afirmar puntualidad garantizada.
- Identidad visual sin cambios; changelog 0.5.40 incluido.
