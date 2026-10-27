# WF-BRAIN-015 — División muscular por sesión semanal Move

## Objetivo
Evolucionar Move como pilar con entrenamiento propio por día, no como un hábito repetido con músculos globales. Especificación incremental sobre WF-BRAIN-014.

## Algoritmo
- Una sesión sin grupos específicos: cuerpo completo.
- Dos sesiones con objetivo general de fuerza/bienestar: superior e inferior.
- Tres o más: rotación empuje (pecho/hombros/tríceps), piernas (piernas/glúteos/core), tirón (espalda/bíceps), sin agregar grupos ajenos a `targetMuscles` cuando el usuario los selecciona.
- Objetivos generales de movilidad o condición sin grupos explícitos: cuerpo completo en cada sesión, para no imponer fuerza.
- Solo se asignan grupos con ejercicios compatibles con el perfil y energía propuesta.
- La planificación conserva separación entre jornadas, recuperación post turno nocturno, protección de horas ocupadas y pausas entre días.
- La rotación avanza con las sesiones efectivamente terminadas dentro de la semana; no reinicia indebidamente si se recalcula después de entrenar.
- `WeeklyMoveSlot.targetMuscles?` es opcional para poder leer los planes 0.5.28 ya guardados.

## Ejecución
- Move puede preparar una sesión del plan confirmado sin cambiar `MovePreferences.targetMuscles`.
- Al iniciar guarda la selección explícita en `ActiveMoveSession.targetMuscles`, conserva el estilo y duración y utiliza esa preferencia específica para construir la rutina guiada.
- Al reabrir la app se recupera ese enfoque; al terminar se almacena `MoveSessionRecord.targetMuscles` para futuras decisiones.
- Los datos guardados de 0.5.28 siguen funcionando: ausencia de `targetMuscles` usa el perfil anterior sin forzar migraciones.
- El motor existente de series, intervalos, equipo, intensidad, restricciones y último feedback sigue siendo la fuente de la rutina.

## Seguridad y límites
- No modificar automáticamente turnos, calendario protegido, sueño ni hábitos.
- No programar grupos incompatibles con restricciones físicas o material.
- La vista previa es orientativa: el entrenamiento real usa energía y equipamiento actuales.
- **No es todavía periodización de 4–6 semanas con progreso específico de cargas**. Ese incremento requiere una estructura adicional de volumen y carga por ejercicio.
- El servidor de OpenAI continúa apagado y no genera gastos.

## Verificación
- Unit tests `move-weekly-split.test.ts`, estructura `move-weekly-split-structure.test.cjs`.
- GitHub TypeScript, regresión y Metro Android, seguida de build Android firmado.
- Prueba en dispositivo, incluidas sesiones reanudadas, pendiente.
