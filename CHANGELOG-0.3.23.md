# WeekFlow Alpha 0.3.23

## Biblioteca Move
- Nueva Biblioteca Move navegable con más de 70 ejercicios.
- Patrones: sentadilla, bisagra/cadera, unilateral, empuje, tirón, core, condición y movilidad.
- Dificultad explícita 1–5, impacto, familia de progresión, equipo y restricciones por ejercicio.
- Filtro para ver solo ejercicios compatibles con el perfil actual.
- La biblioteca no separa ejercicios por género ni usa somatotipos.

## Equipo
- Se amplía el inventario a mancuernas, kettlebell, bandas, barra, banco, barra de dominadas, poleas, máquinas, TRX/suspensión, balón medicinal, cuerda, step/cajón, foam roller y chaleco lastrado.
- Las cargas con kg siguen siendo declaradas por la persona; WeekFlow no aumenta automáticamente los kilos.
- Nuevo ajuste de bajo impacto.

## Progresión por feedback
- Las sesiones guardan los ejercicios efectivamente realizados.
- "Muy fácil" intenta una variante más exigente dentro de la misma familia.
- "Bien" mantiene aproximadamente la dificultad.
- "Difícil" busca una regresión.
- "Demasiado" busca una regresión mayor y conserva la reducción de intensidad/duración existente.
- La progresión nunca puede introducir equipo ausente, zonas evitadas, impacto bloqueado o requisitos incompatibles.

## Compatibilidad
- Preferencias e historial anteriores siguen cargando sin migración de esquema SQLite.
- Preview, player y cambio de ejercicio comparten la misma lógica de compatibilidad.
