# WF-GARDEN-003 + WF-MOVE-011 — Coherencia de pilares y rutina con equipo real

## Problemas observados en capturas
- Jardín mostraba 5 tarjetas «Sin datos» sin fuente ni navegación, pese a hábitos como «Relación amorosa» y «Hacer aseo habitación».
- Move mostraba curl de bíceps con autorresistencia a un usuario que había registrado mancuernas de 5 kg. La elección del catálogo dependía del orden original de IDs por grupo.
- El usuario solicita más ejercicios, pero agregar cientos sin corregir la selección solo aumenta los registros no visibles.

## Comportamiento
1. Mantener ocho pilares canónicos y fuentes separadas. Descanso usa Rest, Alimentación usa Food, Movimiento usa historial y plan Move; los otros cinco se alimentan exclusivamente de hábitos con categoría.
2. La categoría de un hábito es opcional. Los datos heredados reciben **sugerencia por palabras claras**, marcada visualmente; no se guardan cambios automáticos. Los usuarios pueden establecer o quitar categoría al editar.
3. Jardín cuenta hábitos activos y completions de la semana local actual, sin interpretar eso como salud emocional o una puntuación global. Los pilares vacíos muestran «Por configurar» y enlazan a Hábitos.
4. Diferenciar Move completado de Move planificado. Ninguna sesión planificada cuenta como realizada.
5. Se agregan 12 ejercicios compatibles de casa, con variantes, equipo, restricciones y alternativas, ligados a sus músculos.
6. La selección de fuerza ordena variantes elegibles con material declarado antes de sustitutos de autorresistencia, **después de filtrar intensidad, lesiones/restricciones, experiencia y equipamiento**. En recuperación no fuerza carga externa. El historial sigue permitiendo rotación entre sesiones.
7. Sin cambios a WeekFlow Pills, firma Android, identidad de paquete ni suscripción de OpenAI.

## QA
- Tests unitarios de categorías heredadas, personalización, SQLite, tareas registradas, conteo por semana, Move planificado, biblioteca sin ID repetidos y selección con/sin mancuernas.
- Tests estructurales para asegurar rutas de Jardín y persistencia en Hábitos.
- Quality, Metro, Android firmado y prueba en teléfono.
