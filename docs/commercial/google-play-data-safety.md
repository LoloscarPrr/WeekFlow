# WeekFlow 0.3.20 · borrador de Seguridad de los datos

Este documento es la respuesta de trabajo para el formulario **Seguridad de los datos** de Google Play. Debe contrastarse con el AAB exacto que se suba y completarse en Play Console; no acredita una publicación externa.

## Resumen de la versión

- La app funciona sin cuenta y guarda su contenido principal localmente.
- La Cuenta WeekFlow es opcional y usa Firebase Authentication.
- Los horarios, comidas, Move, Rest y demás planificación todavía no se sincronizan en la nube.
- No contiene anuncios, Analytics ni compras activas.
- Firebase Cloud Messaging y Firebase Analytics no se auto-inicializan.
- Firebase Crashlytics está desactivado por defecto y sólo se activa mediante consentimiento explícito dentro de la app.
- Política pública canónica: <https://github.com/LoloscarPrr/WeekFlow/blob/main/PRIVACY_POLICY.md>

## Datos declarables

| Tipo de dato de Play | ¿Se recopila? | ¿Se comparte? | Obligatorio | Finalidad | Manejo |
| --- | --- | --- | --- | --- | --- |
| Información personal · dirección de correo electrónico | Sólo si la persona crea/usa una cuenta | No; Firebase actúa como proveedor de servicio | Opcional | Administración de cuenta, autenticación y recuperación | Cifrado en tránsito; sujeto a los controles de eliminación de la cuenta |
| Información personal · nombre | Sólo si la persona lo añade a su cuenta | No; Firebase actúa como proveedor de servicio | Opcional | Personalización e identidad de cuenta | Cifrado en tránsito; editable desde WeekFlow |
| IDs de usuario · UID de Firebase | Sólo si la persona crea/usa una cuenta | No; Firebase actúa como proveedor de servicio | Opcional | Autenticación y administración de cuenta | Administrado por Firebase Authentication |
| Información y rendimiento de la app · registros de fallos | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Funcionalidad de la app y análisis de estabilidad | Cifrado en tránsito; manejo conforme a Crashlytics |
| Información y rendimiento de la app · diagnósticos | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Funcionalidad de la app y análisis de estabilidad | Mismo manejo que los registros de fallos |
| Dispositivo u otros IDs · identificador de instalación | Sólo si la persona activa los informes | No; Firebase actúa como proveedor de servicio | Opcional | Diagnóstico, agrupación y deduplicación de fallos | No se asocia deliberadamente al UID de Cuenta WeekFlow |

En el formulario, “no se comparte” depende de clasificar correctamente a Google Firebase como proveedor de servicio según las definiciones vigentes de Play. Si cambia la integración o el uso contractual, esta respuesta debe revisarse.

## Datos usados sólo en el dispositivo

No se declaran como recopilados por la conducta de 0.3.20 porque no se transmiten fuera del dispositivo:

- horarios, jornadas, momentos importantes y planificación;
- registros de comida, movimiento y descanso;
- fotos, imágenes, PDF o planillas seleccionadas para importar un horario;
- preferencias y recordatorios locales.

Los archivos de importación se eligen por acción directa de la persona y se procesan localmente. La cuenta no activa sincronización de esos datos en esta versión.

## Control y eliminación

- Toda la app Core sigue funcionando sin Cuenta WeekFlow.
- La persona puede cerrar sesión sin borrar sus datos locales.
- La persona puede solicitar eliminar la identidad desde la pantalla Cuenta WeekFlow; Firebase puede exigir autenticación reciente.
- Eliminar la identidad no borra automáticamente la base local del teléfono; desinstalar o borrar los datos de la app elimina el contenido local sujeto al comportamiento de copia de seguridad de Android.
- Los informes de fallos siguen siendo opcionales y pueden desactivarse desde Privacidad y datos.

## Revisión obligatoria antes de enviar

- [ ] Responder el formulario desde el AAB exacto de 0.3.20.
- [ ] Confirmar que Play Console muestra únicamente los SDK presentes en ese AAB.
- [ ] Declarar correo, nombre y UID como datos opcionales asociados a la funcionalidad de cuenta.
- [ ] Mantener la planificación personal como local mientras no exista la spec de sincronización.
- [ ] Verificar que la URL pública carga sin autenticación.
- [ ] Volver a revisar el formulario si se añade Firestore/sincronización, Analytics, publicidad, mensajería remota o pagos.
