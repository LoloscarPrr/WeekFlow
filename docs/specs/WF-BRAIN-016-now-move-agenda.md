# WF-BRAIN-016 — Move en «Ahora → Lo que viene»

## Defecto reproducible
En 0.5.29 Brain guardaba Move en `moveSlots` del plan confirmado, pero `Ahora` podía ocultarlo por el filtro `at < now`, por el límite de siete momentos o por `timelineAfterFeaturedMoment`, que omitía el primer evento destacado. «Abrir Move» llevaba al pilar sin seleccionar la sesión específica. En un ejemplo real, «Leer» podía además ocupar las 10:30, en paralelo con la comida previa al turno de las 13:00.

## Contrato
- `confirmedMomentsForNow` convierte solo las sesiones Move confirmadas y de la semana vigente en momentos con `plannedMoveId`, nunca un hábito de nombre parecido ni la recomendación genérica.
- Si el horario pasó pero la sesión no se completó, la mantiene como pendiente durante ese día, salvo turno/traslado/recuperación activa. Una sesión completada con `scheduledMoveId` se oculta, sin ocultar las siguientes.
- Si la semana contiene sesiones Move confirmadas, `getNowView` suprime los Move genéricos del día libre en vez de superponerlos.
- `timelineAfterFeaturedMoment` no elimina un Move confirmado aunque sea el momento principal. «Lo que viene» conserva un margen mayor de filas.
- La tarjeta de Move navega a `/pillars` con `moveSlotId`. El reproductor acepta únicamente IDs que existan en el plan confirmado y prepara duración y músculos específicos. El entrenamiento **nunca se inicia sin tocar el botón de comenzar**.
- En el planificador, un turno diurno protege el bloque previo a la entrada según el ritmo ya calculado por Brain (despertar, comida, preparación, traslado). Un plan confirmado anteriormente se preserva y requiere nueva propuesta si ya tiene conflictos.

## Validación
- Tests unitarios: Move confirmado visible, pendiente del día, completado oculto, sesgo de momento destacado, semana vencida y ausencia de Move inventado; horarios preturno no solapados.
- Tests estructurales: fuente de verdad, Deep Link seguro, filtro por jornada y compatibilidad del plan anterior.
- CI Quality y Metro Android, seguido de build firmado y revisión en dispositivo.
