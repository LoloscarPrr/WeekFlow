# WF-QA-001 — Correcciones de prueba física: Cuenta Firebase + Move con cargas suaves

Status: LOCKED
Owner: WeekFlow
Source: prueba física Android 2026-09-19
Approved by: evidencia directa de uso enviada por Oscar

## Problem

La prueba real de WeekFlow Alpha 0.3.21 mostró dos fallas funcionales:

1. Crear/iniciar sesión desde Cuenta WeekFlow termina en un error genérico.
2. Move reconoce mancuernas/kettlebell en el perfil, pero una sesión de Fuerza con intensidad Suave no incluye ningún ejercicio con carga externa.

La investigación del repositorio mostró además que `google-services.json` versionado apunta a otro proyecto Firebase (`rune-nexus-1fedc`) y no al proyecto WeekFlow mostrado en Firebase Console (`weekflow-84a82`). El workflow Android no restaura ni valida el archivo Firebase correcto antes del prebuild.

## Desired behavior

- Todo release Android de WeekFlow debe compilar obligatoriamente con la configuración Firebase del proyecto `weekflow-84a82`, paquete `com.weekflow.app`.
- Si el secreto de Firebase falta o corresponde a otro proyecto, el build debe fallar antes de compilar.
- El error de cuenta debe mostrar un mensaje específico ante una configuración Firebase incorrecta.
- Una sesión Move de Fuerza en intensidad Suave puede incorporar carga externa declarada de forma limitada y controlada.
- Intensidad Recuperación sigue excluyendo carga externa.
- No cambiar la lógica adaptativa general de energía/feedback ni el carácter offline-first.

## Scope

- Workflow Android: restaurar `FIREBASE_GOOGLE_SERVICES_JSON_BASE64` antes de prebuild y validar project_id, project_number y package.
- Account error mapping: configuración Firebase incorrecta/configuración ausente.
- Move: permitir variantes de carga seleccionadas en intensidad Suave cuando el foco/objetivo es Fuerza y el equipo existe.
- Mantener un límite conservador de carga en Suave.
- Tests de regresión.
- Sincronizar versión a 0.3.22.
- Quality + Android release.

## Non-goals

- No Google Sign-In.
- No App Check/MFA.
- No sincronización cloud de planificación.
- No cambiar el cálculo de energía diario.
- No prescribir kg distintos de los que la persona declaró.
- No permitir carga externa en Recuperación.

## Acceptance criteria

- [ ] AC1 — El workflow restaura `google-services.json` desde el secreto y falla si está vacío.
- [ ] AC2 — El workflow valida `project_id=weekflow-84a82`, `project_number=515245749240` y package `com.weekflow.app`.
- [ ] AC3 — El archivo Firebase incorrecto del repo no puede llegar al APK de release si el secreto es válido.
- [ ] AC4 — Cuenta WeekFlow mapea errores de configuración a un mensaje accionable, no al fallback genérico.
- [ ] AC5 — Fuerza + Suave + equipo compatible incluye al menos un ejercicio con carga.
- [ ] AC6 — Suave limita la prioridad de cargas a una variante al inicio de la rutina.
- [ ] AC7 — Recuperación sigue sin ejercicios con equipo.
- [ ] AC8 — Sin equipo declarado no aparecen ejercicios con equipo.
- [ ] AC9 — Quality pasa.
- [ ] AC10 — Android release 0.3.22 pasa y genera APK + AAB firmados.
- [ ] AC11 — La prueba física de cuenta y rutina queda pendiente hasta instalar 0.3.22; no se marca PASS sin dispositivo.

## Verification result

- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
- AC7: PENDING
- AC8: PENDING
- AC9: PENDING
- AC10: PENDING
- AC11: PENDING
