# WF-BRAIN-013 — Solicitud de planificación semanal en el Asistente

## Propósito
Hacer útil el asistente para solicitudes de **varios días** antes de habilitar un modelo remoto, reutilizando el planificador confirmado ya existente en Semana. Esta fase se limita a distribuir *hábitos activos*, no a crear citas, turnos, rutinas Move o ventanas de sueño.

## Flujo
1. La persona solicita «Organiza mi semana», «Planifica mis hábitos» o «Organiza la próxima semana», o toca el acceso rápido en el Asistente.
2. `parseWeeklyPlanningIntent` determina semana actual/próxima. Rechaza frases que piden editar trabajo, medicamentos, horas explícitas, otras fechas o negaciones; no ejecuta acciones parciales.
3. `proposeWeeklyPlan` calcula una vista previa desde Semana, Hábitos, energía histórica, energía actual y configuración de traslado/recuperación. No escribe. Evita turnos y margen de preparación/viaje, protege noche y descanso, y expone faltantes/advertencias.
4. La UI muestra cada sesión propuesta con fecha, hora, tipo full/mini y explicación; muestra todos los avisos del planificador y aclara que sustituirá solo el plan semanal de hábitos existente.
5. «Confirmar semana» usa `confirmWeeklyProposal`, que vuelve a calcular desde datos frescos y comprueba si el plan anterior cambió desde la vista previa. Solo entonces guarda en la key canónica `brain-confirmed-weekly-plan-v1`.
6. «Deshacer planificación semanal» restaura el plan anterior únicamente cuando el plan guardado sigue idéntico al que confirmó el Asistente; no pisa otro plan confirmado después.
7. Tras confirmar o deshacer, se reconcilian los recordatorios. Sin petición explícita no se guarda nada.

## Límites y restricciones
- El calendario semanal de turnos actual se usa como patrón para la semana escogida; si cambian turnos o surgen compromisos nuevos, confirmar de nuevo requiere recalcular.
- Los eventos tienen duración provisional de 60 minutos si falta hora de término.
- No se inventa una hora real de despertar; el motor conserva su advertencia sobre sueño.
- No todas las metas de hábitos necesariamente caben: se indican faltantes sin recortar el descanso.
- No se integra todavía creación automática de planes Move ni cambios de Food/Rest; se planifican los hábitos previamente definidos.
- El modelo remoto OpenAI queda **apagado**, sin consultas ni cargos.

## Corrección de entrega Android
La compilación 0.5.26 falló en `app:createBundleReleaseJsAndAssets` por `Unable to resolve module expo-linking` importado por expo-router. Esta etapa añade `expo-linking ~57.0.13` (versión compatible con Expo SDK 57), registro lockfile y prueba estructural de ambas dependencias. No se modifica la identidad Android.

## Verificación
- Tests unitarios de intención semanal, límites de solicitud, hoy/próxima semana, no mutación, turno diurno, sueño tras turno nocturno y advertencias: automatizados.
- Tests estructurales de revisión, confirmación, reemplazo seguro, undo, sincronización de recordatorios y Expo linking: automatizados.
- GitHub Quality: aprobado en rama de desarrollo.
- Release Android: pendiente de workflow posmerge.
- Prueba física de actualización sin perder datos: pendiente.
