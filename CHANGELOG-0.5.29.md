# WeekFlow Alpha v0.5.29 — Move: división muscular por sesión

## Avance principal
- Brain asigna músculos distintos por sesión semanal: con tres días de fuerza y sin zonas priorizadas, empuje, piernas/core y tirón; con dos días, tren superior e inferior.
- Si el usuario eligió músculos explícitos, solo alterna esos grupos; no inventa ejercicios para otras zonas.
- Para objetivos de movilidad o condición general no impone una división de fuerza, salvo que la persona haya seleccionado grupos concretos.
- Cada vista previa semanal incluye ahora `targetMuscles` propio, que Brain valida otra vez al confirmar.
- Al tocar «Preparar sesión» en Move, adopta la duración y los músculos concretos de ese día SIN alterar el perfil general.
- La sesión guiada persiste la selección muscular durante pausas/reapertura y la guarda en el historial al terminar.
- Completar una sesión no reinicia la rotación al regenerar la semana: se mantiene el siguiente enfoque previsto.
- Pruebas de distribución, compatibilidad con equipo/restricciones, no mutación, regreso a la sesión y confirmación segura.

## Límites
- No hay todavía periodización progresiva de cargas y volumen entre semanas; Move sigue usando sus ajustes por intensidad, equipo y último feedback.
- No obliga a entrenar si las condiciones reales cambiaron: la rutina se recalcula al iniciar.
- OpenAI continúa desactivado, sin consumo pagado.
