# WeekFlow

**Tu semana. Tu ritmo. Tu equilibrio.**

## v4.8.4 — UX de jornadas + splash oficial

Esta versión corrige dos problemas visibles de la app nativa y ajusta el lenguaje de producto sin romper el Core.

### Qué cambia

- La interfaz adopta **Jornada** como término general en lugar de **Turno**.
  - `Agregar jornada`
  - `Jornada de hoy`
  - `Tu jornada marca el ritmo`
  - `Jornada nocturna`
- El modelo técnico interno mantiene `Shift`/`ShiftType` para conservar compatibilidad con SQLite y evitar una migración innecesaria.
- Entrada y Salida dejan de ser campos de texto manuales.
- `@expo/ui` proporciona un selector de hora nativo con formato de 24 horas.
- Tocar una hora abre el selector del sistema; la semana se actualiza solo después de elegir una hora válida.
- Se elimina el problema donde borrar `09:00` o `17:00` provocaba una re-renderización y pérdida del foco.
- Se configura `expo-splash-screen` con fondo `#06101F` e identidad visual WeekFlow.
- GitHub Actions genera el símbolo W + sol para el splash antes de crear el proyecto Android.
- La versión pasa a **4.8.4** y Android a `versionCode 20`.

### Principio de producto

La interfaz habla como una persona, no como el modelo de datos. **Jornada** describe mejor el bloque de trabajo del usuario; `Shift` queda como detalle técnico invisible.

### Arquitectura

- `src/brain/`: reglas y planificación; microcopy actualizado a Jornada.
- `src/state/`: persistencia canónica de Día Vivo + Semana.
- `app/`: experiencia nativa y selector de hora.
- `app.json`: splash oficial y versión Android.
- GitHub Actions: genera assets y compila el APK con la versión real de `app.json`.

### Siguiente etapa canónica

Después de validar esta corrección UX en el APK, el siguiente bloque sigue siendo **importación/OCR con confirmación antes de guardar**. OCR propondrá jornadas detectadas; el usuario revisará y confirmará antes de modificar la semana canónica.
