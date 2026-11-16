# WF-NOTIFY-008 — Estado real y acceso a alarmas exactas en Android

Status: VERIFYING
Owner: WeekFlow
Requested: 2026-11-16
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
En Redmi/Android 15, WeekFlow 0.5.37 muestra permiso de notificaciones y 11 avisos nativos pendientes, pero no comprueba el acceso especial SCHEDULE_EXACT_ALARM. La persona no encuentra la app en los permisos comunes ni en los accesos especiales de Xiaomi. Se muestra una ruta manual que puede no existir en el fabricante.

## Desired behavior
Informar **independientemente** sobre notificaciones y permiso de alarmas exactas; abrir la pantalla correcta al tocar una acción explícita, sin afirmar que habilitar el permiso garantiza entregas puntuales durante Doze.

## Phase / scope
NOW — reparar una brecha observada en el diagnóstico del núcleo de notificaciones, sin construir un nuevo motor de alarmas.
- Módulo Expo local Android compatible con SDK 57 que consulte `AlarmManager.canScheduleExactAlarms()` desde API 31.
- Apertura explícita de `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM` usando package URI. Fallback seguro a información de app si Xiaomi rechaza el intent.
- `unavailable` debe ser distinto de `blocked` si el módulo nativo no existe o falla.
- Diagnóstico compacto con estado y acción contextual, relectura al regresar de Ajustes vía AppState.
- Conserva recordatorios ya programados y pruebas de 5 s y 24 h; no reprograma ni cancela por este permiso.

## Non-goals
- No pedir USE_EXACT_ALARM, acceso de superposición, autoinicio, whitelist de batería, ignorar Doze o permisos no relacionados.
- No cambiar la función de programación DATE ni prometer entrega exacta automática.
- No modificar SQLite, Agenda, Smart Silence, firma, identidad Android, versiónCode generada, Cloud o motor Brain.

## Acceptance
- AC1: Se comprueba el estado vía API nativa Android, no se infiere a partir del permiso de notificaciones.
- AC2: Estados permitido, no permitido y no disponible están diferenciados, con explicación honesta.
- AC3: Tocar 'Revisar alarmas exactas' abre el intent oficial y hace fallback si no existe en fabricante.
- AC4: Al volver al primer plano se vuelve a comprobar; sin prompts automáticos, sin estado guardado engañoso.
- AC5: Diagnóstico anterior y flujos de 5 segundos/24 horas siguen accesibles y sin cambios en el programador.
- AC6: Android Expo 57 compila con módulo local y guardias automáticas; cualquier QA físico se marca pendiente hasta probar en Redmi.
- AC7: La versión técnica 0.5.38 mantiene Android com.weekflow.app y la firma persistente del workflow.

## Verification
PENDING — CI, build firmado y revisión de ajustes físicos en Redmi.
