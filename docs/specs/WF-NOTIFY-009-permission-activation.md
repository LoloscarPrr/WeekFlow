# WF-NOTIFY-009 — Activación explícita de alarmas exactas

Status: LOCKED
Owner: WeekFlow
Date: 2026-11-17
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
En Redmi Android 15 la persona no encuentra WeekFlow en los menús manuales de accesos especiales. Aunque el paquete 0.5.38 incluye SCHEDULE_EXACT_ALARM y un módulo que comprueba el permiso, su única acción está enterrada en el diagnóstico al final de Notificaciones. La persona quiere que **WeekFlow solicite el acceso** mediante el flujo que Android permite.

## Desired behavior
- Cuando las notificaciones están activadas y el acceso especial está denegado, WeekFlow explica el permiso **una sola vez** al abrir la app después de actualizar y ofrece «Abrir permisos» o «Más tarde».
- Solo una acción voluntaria abre la pantalla nativa `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`. El usuario decide; no se auto-concede.
- La pantalla de Notificaciones muestra, al inicio, un acceso contextual claro para consultar/solicitar el permiso. Si está permitido, muestra estado confirmado; si el módulo no puede consultarlo, no inventa un valor.
- Al regresar de Ajustes, refresca el estado. No se promete entrega garantizada en reposo profundo.

## Phase / scope
NOW, fase de confiabilidad y permisos Android observada en dispositivo real.
- Persistir únicamente un marcador booleano de que ya se ofreció la explicación, en la tabla clave/valor SQLite existente, sin migración.
- Ofrecer la explicación solo cuando la persona ya tiene activados recordatorios y el sistema devuelve `blocked`.
- Acción visible en la primera tarjeta de Notificaciones; los avisos/replanificaciones permanecen inalterados.
- El usuario puede reabrir los permisos cuando quiera, aunque ya haya descartado la propuesta inicial.

## Non-goals
- No `USE_EXACT_ALARM`, permisos sensibles adicionales, ni permiso para ignorar ahorro de batería.
- No navegación agresiva ni aperturas automáticas de Ajustes.
- No cambio de hora/entrega/planificador de alarmas, ni limpieza de agenda.
- No tocar SQLite schema, firma, paquete, reglas Brain, otros módulos ni diseño general.

## Acceptance
- AC1: Desde inicio, con preferencias enabled, estado blocked y nunca mostrado, se ofrece diálogo de explicación con elección del usuario.
- AC2: «Más tarde» y «Abrir permisos» registran la decisión; no vuelve a interrumpir en cada apertura.
- AC3: Sin permiso bloqueado, notificaciones desactivadas, Android no compatible o módulo no disponible, no se interrumpe al usuario.
- AC4: El inicio no concede permisos ni llama a ajustes sin toque del usuario.
- AC5: La pantalla Notificaciones presenta al comienzo un indicador y acción contextual `Activar alarmas exactas` para estados blocked/unavailable.
- AC6: Persistencia local existente sin migraciones, servicios de programación y pruebas de 5 s/24 h conservados.
- AC7: Quality completo, Android Metro y compilación firmada 0.5.39; QA física Xiaomi pendiente.
- AC8: Paquete Android `com.weekflow.app`, firma y versionCode monotónico de CI preservados.

## Verification
Pending.
