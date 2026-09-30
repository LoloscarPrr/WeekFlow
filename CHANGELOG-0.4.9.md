# WeekFlow 0.4.9

## Rest
- Corrige una contradicción detectada en uso real: Rest ya no propone pausas/siestas mientras el usuario sigue dentro de una jornada activa.
- El plan futuro de descanso sigue visible durante el turno.
- Fuera del turno se mantienen las pausas contextuales de 20 min (`cansado`) y 30 min (`agotado`) cuando hay margen real.

## QA
- Añade regresión con jornada miércoles 13:00–21:30 a las 16:05 y energía `cansado`: `nap` debe ser `null`.
- Sin cambios de esquema ni migraciones.
- Android source versionCode 91.
