# WF-BRAIN-010 — Energía y Move en una sola propuesta

Blueprint: WeekFlow Blueprint Maestro v4.0, capítulos 9, 14 y reglas de fuentes de verdad.

Estado: QA de Android pendiente

## Problema
El usuario no puede expresar «hoy estoy cansado y quiero entrenar espalda y bíceps» sin separar en dos mensajes. El parser rechaza la combinación, aunque ambos motores están disponibles.

## Alcance aprobado
- Interpretación local determinista solo del **día actual**, energía inequívoca y objetivos musculares compatibles.
- Preview explicable; una confirmación y un Deshacer; persistencia transaccional de DayState + MovePreferences; nunca crear estado paralelo.
- Relectura de ambas fuentes antes de confirmar o deshacer. Bloqueo por cambio de fecha, sesión activa y conflictos de estado.
- No mover horarios, descanso, compromisos o cambiar duración en silencio.
- Tests de casos positivos, negativos, conflictos, estructura, Quality y Android.

## Fuera de alcance
- LLM remoto, entradas de múltiples fechas, replanificación de la semana y cambios de hora en el mismo mensaje.
- Ajustar automáticamente descanso mínimo o duración del entrenamiento.
- WeekFlow Pills.

## QA
- Pruebas del intérprete y Brain Foundation: automatizadas.
- Persistencia transaccional mediante SQLite `withTransactionSync`: revisada por TypeScript + test estructural.
- Validación de compilación Android: pendiente hasta workflow posterior al merge.
- Prueba física actualizando la APK instalada sin perder datos: pendiente.
