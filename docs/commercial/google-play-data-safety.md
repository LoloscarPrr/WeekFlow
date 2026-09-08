# WeekFlow 0.3.17 · borrador de Seguridad de los datos

Este documento es la respuesta de trabajo para el formulario **Seguridad de los datos** de Google Play. Debe contrastarse con la versión exacta que se suba y completarse en Play Console; no acredita una publicación externa.

## Resumen de la versión

- La app funciona sin cuenta y guarda su contenido principal localmente.
- No contiene anuncios, Analytics, compras ni sincronización en la nube.
- Firebase Cloud Messaging y Firebase Analytics no se auto-inicializan.
- Firebase Crashlytics está desactivado por defecto y sólo se activa mediante consentimiento explícito dentro de la app.
- Política pública canónica: <https://github.com/LoloscarPrr/WeekFlow/blob/main/PRIVACY_POLICY.md>

## Datos declarables

| Tipo de dato de Play | ¿Se recopila? | ¿Se comparte? | Obligatorio | Finalidad | Manejo |
| --- | --- | --- | --- | --- | --- |
| Información y rendimiento de la app · registros de fallos | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Funcionalidad de la app y análisis de estabilidad | Cifrado en tránsito; retención de Crashlytics de 90 días antes de iniciar la eliminación |
| Información y rendimiento de la app · diagnósticos | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Funcionalidad de la app y análisis de estabilidad | Mismo manejo que los registros de fallos |
| Dispositivo u otros IDs · identificador de instalación | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Diagnóstico, agrupación y deduplicación de fallos | No se asocia deliberadamente a una identidad o cuenta de WeekFlow |

En el formulario, “no se comparte” depende de clasificar correctamente a Google Firebase como proveedor de servicio según las definiciones vigentes de Play. Si cambia la integración o el uso contractual, hay que revisar esta respuesta.

## Datos usados sólo en el dispositivo

No se declaran como recopilados porque la versión 0.3.17 no los transmite fuera del dispositivo:

- horarios, jornadas, momentos importantes y planificación;
- registros de comida, movimiento y descanso;
- fotos, imágenes, PDF o planillas seleccionadas para importar un horario;
- preferencias y recordatorios locales.

Los archivos de importación se eligen por acción directa de la persona y se procesan localmente. No deben marcarse como recopilados por WeekFlow mientras esa conducta no cambie.

## Control y eliminación

- La persona puede usar toda la app con los informes de fallos apagados.
- Al desactivarlos, la app detiene la recopilación y elimina los informes pendientes de envío en el teléfono.
- La desinstalación elimina los datos locales, sujeto al comportamiento de copia de seguridad de Android.
- Los informes ya enviados siguen la retención de Firebase Crashlytics indicada en la política.

## Revisión obligatoria antes de enviar

- [ ] Responder el formulario desde el AAB exacto de 0.3.17.
- [ ] Confirmar que Play Console muestra únicamente los SDK presentes en ese AAB.
- [ ] Mantener las tres filas anteriores como opcionales y no usadas para publicidad.
- [ ] Verificar que la URL pública carga sin autenticación.
- [ ] Volver a revisar el formulario si se añade Analytics, publicidad, cuenta, nube, mensajería remota o pagos.
