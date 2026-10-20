# WeekFlow Alpha v0.5.16

## Brain 0.7.7 — Preguntas al estado real
- Asistente reconoce preguntas breves sobre lo que importa ahora, energía, sesión Move terminada hoy, registros Food y contexto Rest.
- La respuesta usa el estado real actual al momento de enviar; no mantiene un segundo calendario, no inventa comidas o entrenamientos y no modifica SQLite.
- Campo del Asistente permite preguntas o cambios, con un único mensaje claro y CTA «Enviar».
- Los cambios confirmables de 0.7.3–0.7.6 y «Deshacer cambio» siguen intactos.
- Importación clásica permanece congelada; Smart Import de 0.8.x no se inicia en este cambio.

## Quality
- Pruebas puras de preguntas con y sin registros, estado actualizado y frases no reconocidas.
- Nuevo check estructural de respuesta read-only y acción accesible.
- CI Quality / Android firmado / prueba física registradas por separado en la spec.

Spec: WF-BRAIN-007.
