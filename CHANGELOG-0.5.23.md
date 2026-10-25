# WeekFlow Alpha v0.5.23 — Brain ↔ Move por músculos

## Nuevo
- Asistente reconoce peticiones afirmativas de rutina: «quiero entrenar espalda y bíceps», «prepárame tren superior», «piernas», «cuerpo completo».
- Propuestas confirmables de selección de músculos conectadas al estado canónico Move, con detección de cambios obsoletos, protección de sesiones activas y Deshacer.
- Move permite elegir combinaciones entre pecho, espalda, hombros, bíceps, tríceps, piernas, glúteos y abdomen.
- Series, intervalos y AMRAP adaptados al enfoque cuando sea compatible con energía, nivel, equipamiento y restricciones.
- Alternativas de entrenamiento sin material para bíceps y abdomen.
- Pruebas del parser, compatibilidad, propuestas, persistencia lógica y conflictos.

## Límites actuales
- El intérprete de texto sigue siendo **local y determinista**. No hay todavía LLM/chat abierto ni reorganización autónoma multi-módulo.
- Para cambiar día/hora/energía y músculos se emiten solicitudes separadas. La duración de la sesión se ajusta en Move.
- Ninguna acción modifica datos sin confirmación. No se modifica WeekFlow Pills.
- La actualización Android usa versionCode monotónico calculado por el workflow; no requiere desinstalar.
