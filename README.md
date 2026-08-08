# WeekFlow

**Tu semana. Tu ritmo. Tu equilibrio.**

## Alpha 0.1.0 — Core nativo temprano

WeekFlow vuelve a una numeración pública coherente con su etapa real de desarrollo. La serie 4.8.x correspondía al avance interno de builds, pero transmitía una madurez de producto que todavía no corresponde.

### Versionado canónico

- Versión pública actual: **0.1.0 Alpha**.
- `expo.version` y `package.json` usan `0.1.0`.
- Android mantiene un `versionCode` interno creciente para permitir actualizaciones sobre APK anteriores. Este número no representa madurez del producto.
- Las futuras versiones públicas avanzan desde la línea 0.x mientras WeekFlow siga en desarrollo previo a 1.0.

### Identidad visual bloqueada

Los assets oficiales viven en `assets/brand/` y son fuente de verdad visual:

- `weekflow-icon.webp`: icono oficial de la app, basado directamente en el arte aprobado por el fundador.
- `weekflow-splash.webp`: lockup/pantalla de arranque oficial con icono, wordmark WeekFlow y “Flujo & Equilibrio”.

Regla: **no redibujar, reinterpretar, recolorear ni sustituir estos logos**. Los procesos de build solo pueden realizar cambios técnicos obligatorios como redimensionado o conversión de formato.

El mismo icono oficial se usa en el header de la app. Launcher, adaptive icon y splash se derivan únicamente de los assets bloqueados anteriores.

### UX vigente

- La interfaz usa **Jornada** como término general en lugar de **Turno**.
- Entrada y Salida usan selector de hora nativo.
- Semana persistente, Día Vivo y `Ya salí` siguen compartiendo la misma fuente de verdad.
- El modelo técnico puede conservar `Shift`/`ShiftType` internamente sin exponerlo al usuario.

### Siguiente etapa canónica

Después de validar Alpha 0.1.0, el siguiente bloque sigue siendo **importación/OCR con confirmación antes de guardar**. OCR propondrá jornadas detectadas; el usuario revisará y confirmará antes de modificar la semana canónica.
