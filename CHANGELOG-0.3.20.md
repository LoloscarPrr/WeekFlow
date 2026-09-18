# WeekFlow Alpha 0.3.20

## Cuenta WeekFlow
- Cuenta opcional con Firebase Authentication por correo y contraseña.
- Crear cuenta, iniciar/cerrar sesión, recuperar contraseña, verificar correo y editar nombre.
- Eliminación de identidad con confirmación; los datos locales no se borran al cerrar sesión ni al eliminar la cuenta.
- El perfil local ahora incluye nombre además del nombre usado en la planilla.
- La planificación sigue funcionando offline y no se sincroniza todavía con la nube.
- Privacidad y Seguridad de los datos se actualizan para la nueva identidad opcional.

## Infraestructura
- Añadido `@react-native-firebase/auth` junto a la integración Firebase existente.
- Billing sigue desactivado y WeekFlow conserva un solo paquete `com.weekflow.app`.
- La sincronización de planificación queda para una spec posterior.
