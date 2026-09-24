# Política de privacidad de WeekFlow

Última actualización: 24 de septiembre de 2026

WeekFlow es una aplicación de organización personal para Android. Esta política explica qué datos usa la aplicación, dónde se procesan y qué controles tiene la persona usuaria.

## Cuenta WeekFlow opcional

WeekFlow puede usarse sin crear una cuenta. Si una persona decide crear una Cuenta WeekFlow, Firebase Authentication, un servicio de Google, procesa los datos necesarios para identificar y recuperar esa cuenta:

- dirección de correo electrónico;
- identificador único de usuario (UID);
- nombre visible elegido por la persona;
- metadatos técnicos de autenticación administrados por Firebase, como fechas de creación y último acceso.

La contraseña es procesada por Firebase Authentication. WeekFlow no la guarda en SQLite, no la incluye en sus registros de planificación y no la almacena deliberadamente en sus propios archivos.

La finalidad de estos datos es permitir crear una cuenta, iniciar y cerrar sesión, recuperar el acceso, verificar el correo y administrar la identidad. Esta versión no usa la cuenta para sincronizar horarios, comidas, movimiento, descanso ni otros registros personales entre dispositivos.

La persona puede eliminar su identidad desde la pantalla **Asistente → Cuenta WeekFlow**. Firebase puede exigir una autenticación reciente antes de completar una eliminación sensible. Eliminar o cerrar la cuenta no borra automáticamente la planificación que permanece localmente en el dispositivo; esos datos pueden eliminarse borrando los datos de la aplicación o desinstalándola, sujeto al comportamiento de copia de seguridad de Android.

## Datos que permanecen en el dispositivo

WeekFlow guarda localmente en una base de datos de la aplicación:

- jornadas y horarios de trabajo;
- momentos importantes y planificación diaria;
- registros de comida, movimiento y descanso;
- preferencias, estado de la aplicación y consentimiento de privacidad.

En la versión actual esos datos de planificación no se sincronizan con Firebase Authentication ni con un servidor de WeekFlow. Si en una versión futura se habilita respaldo o sincronización, la política y la información dentro de la aplicación deberán actualizarse antes de activar esa conducta.

## Cámara, imágenes y archivos

La cámara y el selector de archivos se usan únicamente cuando la persona elige importar un horario o revisar ingredientes dentro de Food. Las imágenes, PDF y planillas seleccionadas para horarios se procesan en el dispositivo para reconocer o extraer la información.

En Food, una foto elegida o tomada se procesa localmente para leer nombres o etiquetas visibles y proponer candidatos de despensa. La foto no se guarda como parte de la despensa ni se sube a servidores de WeekFlow. Los candidatos solo se incorporan cuando la persona los revisa y confirma; si la imagen no permite reconocer suficiente texto, se puede completar manualmente.

WeekFlow no adjunta deliberadamente estas imágenes a informes de fallos.

## Notificaciones

Las notificaciones de WeekFlow son recordatorios locales programados en el dispositivo. La aplicación no utiliza Firebase Cloud Messaging para registrar el dispositivo ni para enviar notificaciones remotas.

## Informes técnicos de fallos opcionales

Los informes de fallos están desactivados por defecto. Si la persona los activa expresamente en **Asistente → Privacidad y datos**, WeekFlow utiliza Firebase Crashlytics, un servicio de Google, para recibir:

- registros de fallos y diagnósticos técnicos;
- versión de la aplicación;
- modelo, arquitectura y versión del sistema operativo del dispositivo;
- fecha y hora del fallo;
- identificadores de instalación utilizados por Firebase para agrupar y diagnosticar incidentes.

La finalidad exclusiva es detectar problemas de estabilidad y corregir errores. WeekFlow no vende estos datos, no los usa para publicidad y no configura deliberadamente el UID de la Cuenta WeekFlow como identificador de usuario en Crashlytics. Google procesa esta información como proveedor técnico y puede hacerlo en los países donde mantiene infraestructura.

Al desactivar esta opción, WeekFlow detiene la recopilación futura y solicita eliminar los informes que aún no se hayan enviado desde el dispositivo. Los informes ya transmitidos siguen la retención aplicable de Firebase Crashlytics.

## Compartición, venta y publicidad

WeekFlow no contiene anuncios y no vende datos personales. Google Firebase actúa como proveedor técnico únicamente para los servicios activados en esta versión:

- Firebase Authentication, cuando la persona usa una Cuenta WeekFlow;
- Firebase Crashlytics, solo cuando la persona habilita expresamente los informes técnicos de fallos.

La planificación local no se comparte con esos servicios en esta versión.

## Seguridad

WeekFlow limita el tratamiento a los datos necesarios para las funciones descritas. Las operaciones de autenticación y los informes opcionales se transmiten mediante conexiones cifradas administradas por Firebase. Ningún sistema es infalible; por eso se evita recopilar información personal que no sea necesaria.

## Menores de edad

WeekFlow no está dirigida a menores de 13 años ni está diseñada para recopilar deliberadamente sus datos personales.

## Cambios a esta política

Si cambia el tratamiento de datos, especialmente si se habilita sincronización en la nube, esta política y la información dentro de la aplicación se actualizarán antes de distribuir la nueva conducta.

## Contacto

Para consultas o solicitudes de privacidad, abre una [consulta en el repositorio oficial de WeekFlow](https://github.com/LoloscarPrr/WeekFlow/issues/new). No incluyas horarios, imágenes, contraseñas, datos de salud ni otra información sensible, porque las consultas pueden ser públicas.
