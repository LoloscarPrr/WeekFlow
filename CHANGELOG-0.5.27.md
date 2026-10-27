# WeekFlow Alpha v0.5.27 — Brain: planificación semanal por conversación local

## Nuevo
- «Organiza mi semana» y «Planifica mis hábitos para la próxima semana» generan una **propuesta semanal revisable** en el Asistente.
- Acceso directo «Organizar mi semana · Vista previa».
- Se reutilizan Semana + Hábitos + energía y los bloqueos de trabajo, traslados, turno nocturno y recuperación del planificador existente.
- Lista visible de fechas, horarios, versiones mini, explicaciones, advertencias y objetivos pendientes.
- Confirmación protegida contra cambios posteriores a la vista previa; deshacer que no reemplaza modificaciones recientes.
- Reconciliación de recordatorios tras confirmar y tras deshacer.

## Android
- Corrige dependencia ausente `expo-linking` compatible con Expo SDK 57 y sincroniza `package-lock.json`.
- La compilación 0.5.26 había fallado en el empaquetado Metro; 0.5.27 requiere nueva validación de APK.

## Límites
- Esta etapa distribuye únicamente **hábitos existentes**, no crea una rutina Move, eventos ni turnos nuevos; no altera sueño ni medicación.
- Sin modelo generativo online: OpenAI permanece desactivado, sin consumo de API.
- Necesita comprobación física del instalador Android después del build.
