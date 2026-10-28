# WF-BRAIN-018 — Reglas y excepciones por hábito

## Necesidad
Las pruebas en dispositivo de la versión anterior exhibieron dos límites concretos:
- «Necesito que mi relación amorosa se organice sólo para los días libres».
- «Mañana no voy a leer porque estoy donde un amigo ahora».

No se deben tratar como comida, energía ni cambios de turno. Tampoco equivalen a borrar el hábito.

## Diseño
- `Habit.dayRule?: 'any'|'off-days'` y `Habit.skipDates?: string[]`, opcionales para registros anteriores. Sanitizados al leer desde SQLite.
- `parseHabitConstraintIntent` reconoce explícitamente un solo hábito activo por nombre; rechaza frases contradictorias, eliminación, fecha pasada y ambigüedad. En ausencia de reconocimiento, el asistente local conserva su respuesta segura.
- `proposeHabitConstraintChange` calcula los efectos **sin escritura** sobre los datos reales: conserva Move, demás hábitos, completions y turnos.
- Una regla «solo días libres» exige que el turno guardado para ese día tenga `type='off'`; un turno sin declarar NO se considera libre.
- Omitir mañana agrega una excepción por fecha local (sin marcar la tarea como completada). Se limita a fechas próximas y conserva el objetivo semanal.
- La UI presenta antes/después y solicita confirmación. Al confirmar se verifica que Habits, Semana y el plan confirmado no hayan cambiado desde la vista previa. Se guardan la regla y el retiro de sesiones incompatibles; se reconcilian recordatorios.
- Undo compara instantáneas posteriores completas para no sobreescribir cambios nuevos.
- Para reorganizar sesiones pendientes la persona confirma por separado una nueva propuesta semanal; el asistente no altera Move o los horarios laboral/sueño en segundo plano.

## Criterios
1. Solo días libres afecta únicamente al hábito mencionado y no agenda durante turnos.
2. Saltar una fecha no borra el hábito ni la marca «Hecho».
3. Mover / omitir no afecta el historial previo ni Move.
4. Cambios solo ocurren tras confirmación; se permiten cancelar y deshacer con protección.
5. Pruebas sobre los dos textos reales, casos ambiguos, negaciones, calendarios y persistencia.
6. OpenAI sigue apagado, sin costos.

## Fuera de alcance
- Comprensión abierta de cualquier frase, cambios de varias actividades a la vez, disponibilidad de otras personas y sincronización remota.
- Reparto automático del tiempo perdido sin un nuevo paso de confirmación.
