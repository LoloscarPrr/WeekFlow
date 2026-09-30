# WF-REST-002 — No sugerir pausas durante una jornada activa

Estado: LOCKED
Versión técnica: 0.4.9

## Problema
La primera versión de pausas contextuales podía proponer una pausa corta usando solo energía + margen hasta el sueño siguiente. En una jornada diurna activa eso producía una contradicción: Rest reconocía “Jornada en curso”, pero a la vez proponía dormir antes de la salida programada.

Caso real observado el 30/09/2026: jornada activa hasta 21:30 y sugerencia “Pausa opcional 16:20–16:40”.

## Decisión
Una pausa contextual solo puede aparecer cuando el usuario no está dentro de una jornada laboral activa. El plan futuro de sueño/despertar puede seguir mostrándose durante el turno, pero `plan.nap` debe ser `null` hasta que la jornada termine.

## Acceptance Criteria
- AC1: Si `shiftContextForDate` indica una jornada activa, Rest no entrega una pausa contextual.
- AC2: El plan principal de cierre/sueño/despertar/próxima entrada sigue visible durante una jornada diurna activa.
- AC3: `Jornada en curso` continúa siendo el contexto visible durante el turno.
- AC4: Fuera de una jornada activa, `cansado` y `agotado` conservan las pausas de 20 y 30 min cuando los guardrails existentes lo permiten.
- AC5: El caso real miércoles 13:00–21:30, ahora 16:05, energía `cansado`, queda cubierto por regresión y devuelve `nap: null`.
- AC6: Typecheck, regresiones y build Android firmado pasan antes de cerrar la spec.

## No cambia
- No cambia la ventana principal de sueño.
- No cambia recuperación post-turno nocturno.
- No cambia persistencia, SQLite ni esquema.
- No añade permisos ni notificaciones.
