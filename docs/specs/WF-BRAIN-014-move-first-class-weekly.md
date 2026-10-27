# WF-BRAIN-014 — Move como pilar autónomo dentro de Semana

## Motivación
Move no debe depender de crear el hábito «Ejercicios». Es un pilar con objetivos, equipo, cargas, feedback y sesiones propias. El planificador semanal debe consumir la **fuente de verdad Move** y mantener Hábitos como trabajo flexible independiente.

## Aceptación de esta primera etapa
1. MovePreferences guarda `weeklyTargetSessions` (0 a 5, valor predeterminado 3) y `preferredSessionMinutes` (30/45/60). Se conservan perfiles SQLite anteriores sin migración destructiva.
2. Move muestra controles semanales propios, separados de las preferencias de ejercicio de cada sesión.
3. `proposeWeeklyPlan` incluye `moveSlots` y `moveSummary` separados de `slots` de Hábitos. Lee preferencias e historial de Move; cada propuesta utiliza el motor de rutina `routineForDuration` y `recommendMoveIntensity`.
4. Sesiones semanales Move se distribuyen **antes de los hábitos flexibles**, sin solapamientos, turnos, compromisos, traslados o recuperación post turno nocturno. Se separan días de entrenamiento y se reconocen sesiones ya completadas.
5. Si los músculos elegidos carecen de ejercicios compatibles con restricciones/equipo, no se programa una falsa rutina. Si no caben todas las sesiones, se avisa sin recortar el descanso.
6. La propuesta se muestra agrupada por pilar y Hábitos en Semana y Asistente, con horario estimado, duración, intensidad, ejemplos de ejercicios, objetivos cubiertos y advertencias.
7. Confirmar vuelve a calcular con preferencias e historial frescos. Se conserva undo protegido y sincronización de recordatorios.
8. Ahora muestra sesiones Move confirmadas como momentos de tipo `move`. Move muestra la siguiente sesión y permite preparar su duración para el reproductor real; al iniciar, Move recalcula la intensidad.
9. Si está activo un hábito de nombre exacto «Ejercicios», «Entrenamiento», «Gimnasio», etc., se evita duplicar sus bloques de entrenamiento en la propuesta. **El hábito y su historial no se eliminan ni alteran**.
10. Los avisos Move solo se crean a partir de planes confirmados y pasan por Smart Silence; no se inventan controles de notificaciones que aún no existen.

## Limitaciones explícitas
- **Todavía no existe un split progresivo de fuerza por día**, ni periodización de cuatro semanas o selección muscular variable por sesión. En esta fase Move repite el objetivo muscular configurado, con al menos un día de separación y ajuste de intensidad al iniciar.
- La hora semanal es una propuesta confirmada, no garantía clínica de preparación física. No se inventan horas reales de despertar.
- Si hay un evento sin duración registrada, el planificador conserva su reserva provisional de 60 minutos.
- El plan confirmado no altera turnos, sueño, comidas, historial Move ni perfil físico.
- OpenAI API sigue desactivado y no se facturan consultas de IA mediante esta implementación.

## Calidad
- Pruebas unitarias de perfil legado, sesiones sin hábitos, energía, equipo, trabajo nocturno, separación, no solapamiento, no mutación, futuro e historial: `tests/brain-move-weekly.test.ts`.
- Pruebas estructurales de Move, Semana, Asistente, Ahora y notificaciones: `tests/brain-move-weekly-structure.test.cjs`.
- GitHub Quality (TypeScript, regresión, Metro) y build Android firmado antes de anunciar APK disponible.
- Prueba en teléfono y progresión avanzada pendientes.
