# WeekFlow Alpha v0.5.16

## Brain 0.7.7 — consultas desde el estado real
- El Asistente responde preguntas concretas sobre Ahora, Move, Food, Rest y energía.
- Las respuestas vienen de las mismas fuentes de verdad que usan las pantallas correspondientes.
- Sin datos ni respuestas inventadas: diferencia registros reales de su ausencia.
- Una pregunta no guarda nada ni dispara avisos; si había una propuesta pendiente, se descarta sin ejecutar.
- «Deshacer cambio» de acciones anteriores sigue disponible mientras sea seguro.
- Entrada conversacional compacta, con ejemplo de pregunta y limpieza de texto al responder.
- Se conserva el sistema de acciones confirmadas, salidas reales y desfases relativos.

## Integridad
- No cambia esquema SQLite, paquetes externos, firma ni identificador de Android.
- La compilación Android y Quality CI se verifican antes de publicar el APK.

Spec: WF-BRAIN-007.
