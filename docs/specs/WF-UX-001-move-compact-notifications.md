# WF-UX-001 — Move compacto y recordatorios prioritarios

Status: LOCKED
Owner: WeekFlow
Source: prueba física Android 2026-09-18

## Problem

La prueba real de Move mostró que el flujo diario repite demasiada información persistente: objetivo base, experiencia, peso, altura y equipo ocupan gran parte de la pantalla aunque normalmente no cambien en cada sesión. A la vez, los recordatorios deben sentirse como una función central: un evento guardado tiene que programar su aviso inmediatamente y no depender de volver a abrir la app dentro de una ventana corta.

## Desired behavior

- Move deja visibles primero las decisiones de hoy: enfoque, restricciones rápidas y tiempo disponible.
- El perfil persistente queda resumido y editable bajo demanda.
- Objetivo base y enfoque del día dejan de competir visualmente.
- Silla, suelo y zonas a evitar se expresan con controles compactos.
- Las notificaciones locales usan prioridad máxima en Android.
- Guardar, borrar o cambiar jornadas/eventos resincroniza recordatorios en ese momento.
- Los eventos importantes futuros se programan aunque estén a más de siete días.
- Las jornadas mantienen avisos anticipados con una ventana más amplia.

## Scope

- UI de preparación de Move.
- Sin cambios en la generación adaptativa, historial, feedback ni reproducción de sesiones.
- Servicio local de notificaciones y sincronización desde Semana.
- Versión 0.3.20.

## Acceptance criteria

- [ ] AC1 — El perfil persistente aparece resumido y cerrado por defecto.
- [ ] AC2 — Enfoque diario, silla/suelo y zonas a evitar usan controles compactos.
- [ ] AC3 — La edición completa de perfil/equipo sigue disponible sin pérdida de datos.
- [ ] AC4 — Guardar o eliminar un evento importante resincroniza recordatorios de inmediato.
- [ ] AC5 — Cambiar entrada/salida o marcar día libre resincroniza las jornadas; editar colación no dispara sincronización innecesaria.
- [ ] AC6 — Todo evento importante futuro puede dejar una notificación programada, sin horizonte artificial de siete días.
- [ ] AC7 — Android usa un canal nuevo con importancia máxima y prioridad máxima para contenido local.
- [ ] AC8 — La reconciliación sigue deduplicando IDs actuales y notificaciones heredadas conocidas.
- [ ] AC9 — Quality y Android release pasan antes de marcar DONE.

## Verification plan

- [ ] Revisar diff.
- [ ] Ejecutar Quality en PR.
- [ ] Fusionar a main.
- [ ] Confirmar Android release firmado con APK/AAB.
- [ ] Probar físicamente en Android: crear evento, editarlo/eliminarlo y verificar aviso local.
