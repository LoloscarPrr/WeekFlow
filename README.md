# WeekFlow

**Tu semana. Tu ritmo. Tu equilibrio.**

## v4.8.2 — Core / Día Vivo persistente

Esta versión continúa el camino canónico: primero estabilizar Core / Día Vivo antes de OCR o de profundizar módulos secundarios.

### Qué cambia

- `src/state/persistence.ts` guarda el contexto del día en SQLite.
- Energía, turno base, tiempos de traslado/preparación y salida real sobreviven al cierre de la app.
- `app/index.tsx` carga el estado persistido y alimenta al mismo WeekFlow Brain.
- `Ya salí` registra la hora real del usuario.
- `src/brain/engine.ts` replanifica desde esa salida real:
  - actualiza el regreso a casa,
  - recalcula la descompresión,
  - mueve solo los bloques flexibles posteriores.
- Trabajo, descanso protegido y demás bloques fijos no se destruyen para acomodar una salida tardía.
- Ida y regreso continúan siendo tiempos separados.
- La salida real solo se aplica al día en que fue registrada.

### Principio de producto

La planificación se adapta a la realidad, no al revés. Una modificación real del día debe propagarse por el mismo Core en lugar de generar estados contradictorios entre pantallas.

### Arquitectura

- `src/brain/`: reglas y planificación.
- `src/state/`: persistencia del estado real.
- `app/`: experiencia nativa que consume Brain + State.
- GitHub Actions: compilación, no lógica de producto.

### Siguiente etapa canónica

Consolidar **turnos y semana persistentes** como una única fuente de verdad nativa. Después de eso: importación/OCR de horarios y confirmación antes de guardar.
