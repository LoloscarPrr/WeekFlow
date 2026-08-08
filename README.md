# WeekFlow

**Tu semana. Tu ritmo. Tu equilibrio.**

## v4.8.3 — Semana y turnos persistentes

Esta versión completa el siguiente bloque canónico del Core: la semana real pasa a ser la fuente de verdad para Día Vivo.

### Qué cambia

- `src/state/persistence.ts` guarda dos contextos separados pero coordinados en SQLite:
  - estado del día: energía, tiempos y salida real,
  - estado de semana: siete turnos persistentes.
- El turno demo deja de ser la fuente del Brain.
- `shiftForDate()` resuelve automáticamente el turno correspondiente al día actual.
- `app/index.tsx` permite editar cada día como trabajo o libre y definir entrada/salida.
- Cambiar el turno de hoy invalida una salida real antigua para evitar contradicciones.
- Día Vivo, energía y `Ya salí` siguen alimentando el mismo WeekFlow Brain.
- Se mantiene la migración desde el formato v4.8.2 para no perder tiempos ya guardados.

### Principio de producto

Una sola realidad, un solo Core. Semana no puede decir una cosa mientras Ahora calcula otra.

### Arquitectura

- `src/brain/`: reglas y planificación.
- `src/state/`: persistencia canónica de Día Vivo + Semana.
- `app/`: experiencia nativa que consume esa única fuente de estado.
- GitHub Actions: compilación, no lógica de producto.

### Siguiente etapa canónica

Preparar el **flujo de importación/OCR con confirmación antes de guardar**. OCR no deberá escribir directamente sobre la semana: primero propone turnos detectados, el usuario confirma y recién entonces se actualiza el estado canónico.
