# WF-BRAIN-017 — Configuración semanal de Move y gestión de Hábitos

## Observaciones de pruebas en teléfono
El panel de Move mostraba controles semanales al lado de músculos, enfoque y materiales, aunque el usuario espera configurar frecuencia y duración en «Organizar semana». La vista previa de 30 minutos repite cuatro ejercicios y no rota bien entre entrenamientos. Hábitos permite editar, marcar y mover, pero carece de eliminar.

## Comportamiento implementado
1. El panel **Semana → Planear pilares y hábitos** guarda la frecuencia de Move (0–5) y la duración (30/45/60) mediante `saveMovePreferences`; no duplica la fuente de datos. Modificaciones invalidan la vista previa no confirmada, no actualizan el calendario confirmado sin aprobación.
2. El panel de Move deja músculos y ejercicios, y remite explícitamente a Semana para frecuencia.
3. 18 movimientos nuevos con cue, simplificación, familia y restricciones de articulaciones y equipamiento. El selector muscular usa histórico `previousExerciseIds` para favorecer ejercicios no usados en la sesión anterior.
4. «Eliminar» en Hábitos exige confirmación destructiva explícita. Se eliminan el hábito seleccionado y sus completions, se retiran sus slots y shortfalls de `brain-confirmed-weekly-plan-v1`, y se recalculan recordatorios. **Move y los demás hábitos permanecen**. No se interpreta como pausa temporal.
5. La app sigue reconociendo hábitos heredados; no se renombra ni elimina «Relación amorosa» u otros automáticamente.

## No incluido aún
- Restricciones semánticas del tipo «solo en días libres» o «mañana no puedo leer porque estoy donde un amigo» en el intérprete local. La captura demuestra ese límite. En una fase posterior necesitará reglas canónicas de disponibilidad por hábito con revisión/confirmación, no un cambio oculto.
- Periodización de fuerza de semanas sucesivas.
- LLM online; OpenAI permanece desactivado.

## QA
Quality incluye tests de borrado puro, catálogo nuevo, ejercicios con restricciones, rotación y estructura de Semana/Hábitos. Android Metro y firmado pendientes de workflow.
