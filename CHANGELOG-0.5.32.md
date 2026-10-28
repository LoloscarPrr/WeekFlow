# WeekFlow Alpha 0.5.32 — Disponibilidad real de hábitos en Brain (offline)

## Funcionalidad
- El asistente local interpreta solicitudes explícitas como **«Necesito que mi relación amorosa se organice sólo para los días libres»** y **«Mañana no voy a leer porque estoy donde un amigo ahora»** cuando el hábito ya existe en WeekFlow.
- Propone cambiar la disponibilidad permanente de un hábito a **solo días libres**, o excluir **una fecha concreta**. Antes de guardar, muestra el hábito, la regla y el número de sesiones confirmadas que retiraría.
- Cada modificación exige **Confirmar regla**. Una confirmación cambia únicamente el hábito identificado y los bloques incompatibles de ese hábito en el plan semanal; nunca toca las sesiones Move, los turnos ni otros hábitos.
- Los hábitos siguen activos y **las excepciones no cuentan como hechos**. Se conservan objetivos e historial de cumplimiento.
- Al reorganizar Semana, Brain respeta los días que el calendario laboral marca LIBRE y las fechas excluidas. Los objetivos que ya no caben se muestran como pendientes.
- Incluye **Deshacer regla**, protegido contra sobrescritura si otro cambio modificó los datos después de confirmar, y conciliación de recordatorios.
- Los datos anteriores se migran suavemente por normalización SQLite, sin borrar hábitos ni requerir base nueva.

## Límites
- El parser local es intencionalmente conservador: no interpreta cualquier conversación natural ni adivina motivos o relaciones personales. Necesita un hábito registrado y una instrucción clara; no confunde «omitir mañana» con borrar el hábito.
- No redistribuye inmediatamente las sesiones afectadas; exige pedir **Organizar mi semana** y confirmar el nuevo plan.
- La restricción semanal aplica al patrón de turnos guardado; si se actualiza el horario, la persona debe revisar el plan.
- No se inicia consumo de OpenAI API.

## QA
- Pruebas unitarias de interpretación, reglas permanentes, excepciones, calendario, Move intacto y sin falsas confirmaciones.
- Pruebas estructurales de confirmación, deshacer y persistencia; Quality/Metro y Android firmada después de fusionar.
