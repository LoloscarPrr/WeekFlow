# WeekFlow Alpha 0.3.27

## Notificaciones útiles
- "Salir hacia el trabajo" ahora notifica exactamente a la hora de salida calculada por WeekFlow, usando traslado de ida + margen.
- Los eventos importantes notifican 15 min antes; si se registran dentro de esos 15 min, el aviso queda para la hora exacta del evento.
- Rest notifica en el "Cierre orientativo", usando el mismo cálculo que la pantalla de descanso.

## Consistencia
- La salida usa los mismos minutos de traslado y margen que el Brain.
- Rest comparte una única función de cálculo para cierre, descanso y despertar entre UI y notificaciones.
- Cambiar horarios, eventos o ajustes del día vuelve a sincronizar los recordatorios sin duplicarlos.

## Sin cambios visuales
- Se conservan las correcciones ya validadas de Cuenta y Move en 0.3.26.
