# WF-NTF-05 — Estado de salida desde notificación

Status: PLANIFICADO
Catalog ID: NTF-05
Target: 0.8.x
Canonical decisions: D-026, D-027
Approved by: Oscar · 25-09-2026
Blueprint: WeekFlow Blueprint Maestro v3.4

## Product decision

WeekFlow mantiene una sola aplicación y una sola verdad de datos.

- **Free = control manual completo.** La persona puede crear, editar, corregir y ejecutar la planificación nuclear sin IA.
- **Premium = capa inteligente.** WeekFlow Brain + IA + texto/voz + automatización reducen pasos y carga mental sobre los mismos datos.
- Premium no bloquea datos propios ni convierte la app Free en una demo.
- Si Premium no está disponible, el flujo vuelve a control manual sin pérdida de información.

## Problem

Cuando la realidad cambia durante una salida o traslado, abrir la app y navegar hasta el control correcto añade fricción justo en el momento en que WeekFlow debería reducirla.

El caso inicial aprobado es informar el estado de salida directamente desde una notificación.

## Canonical UX

Una notificación contextual puede preguntar por el estado de salida y ofrecer tres acciones rápidas:

- **Aún no salgo**
- **Voy saliendo**
- **Ya voy en camino**

La respuesta debe registrarse sin abrir la app.

### Free

La acción rápida registra el hecho real en la jornada correcta y actualiza el estado visible de Ahora/Día Vivo.

Free no reorganiza silenciosamente el resto del día. La persona conserva edición y corrección manual completas.

### Premium

La misma respuesta puede ser interpretada por WeekFlow Brain junto con jornada, compromisos, traslados y actividades flexibles.

Premium puede:

- explicar el impacto;
- proponer ajustes;
- reorganizar únicamente lo futuro y flexible;
- pedir confirmación cuando el impacto sea relevante.

Lo fijo no se modifica unilateralmente.

## Data contract

El hecho debe entrar en la misma fuente canónica usada por Ahora, Semana y Brain; no se crea una agenda paralela.

Estado mínimo de salida:

- `not_departed` — Aún no salgo.
- `leaving` — Voy saliendo.
- `en_route` — Ya voy en camino.

Debe conservarse el vínculo con la jornada/compromiso al que corresponde y permitir corrección posterior.

## Acceptance criteria

- AC1 — Con la app cerrada, la notificación muestra las tres acciones rápidas cuando corresponde.
- AC2 — Pulsar una acción persiste el estado en la jornada correcta sin abrir la app.
- AC3 — Ahora/Día Vivo refleja el nuevo hecho al abrirse o actualizarse.
- AC4 — La respuesta puede corregirse después sin reconstruir la jornada.
- AC5 — Free registra el cambio y mantiene control manual; no ejecuta replanificación inteligente silenciosa.
- AC6 — Premium puede evaluar impacto y proponer/reordenar solo futuro flexible de acuerdo con BRN-03, BRN-05 y BRN-06.
- AC7 — Jornadas nocturnas y cruces de medianoche asocian la respuesta a la jornada real correcta.
- AC8 — Responder dos veces o recibir una notificación retrasada no debe duplicar hechos ni corromper el estado.
- AC9 — El flujo funciona offline para el registro local; cualquier servicio Premium degradable vuelve a control manual.
- AC10 — La actualización de la app conserva estos estados y los datos previos.

## Out of scope

- GPS o seguimiento pasivo permanente.
- Detectar automáticamente si la persona salió de casa.
- Cambiar compromisos fijos sin confirmación.
- IA autónoma total.
- Convertir una notificación en una segunda fuente de verdad.

## Dependency / sequencing

NTF-05 pertenece a 0.8.x y depende de una base estable de notificaciones locales, persistencia, manejo correcto de jornadas y contratos del Brain.

Registrar esta spec no autoriza saltarse las puertas P0 ni adelantar 0.8.x por encima del roadmap maestro.
