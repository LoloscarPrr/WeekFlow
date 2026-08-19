# WeekFlow Alpha 0.3.2

## Commercial Foundation

- Añade una capa de entitlements Free/Premium desacoplada de la UI y de Google Play Billing.
- Mantiene Billing desactivado durante esta etapa (`billingEnabled: false`).
- Define como Free el núcleo actual: Semana, Día Vivo, Ya salí, momentos importantes, persistencia offline y bases de Rest/Move/Food.
- Reserva para Premium capacidades futuras de automatización, adaptación avanzada, sincronización y Assistant/Brain.
- Las funciones Free permanecen disponibles aunque un entitlement Premium expire.
- Añade pruebas de regresión específicas para las reglas comerciales.
- Sube la app a 0.3.2 y Android `versionCode` a 57.

Esta versión prepara la monetización futura sin introducir compras ni romper el comportamiento actual.
