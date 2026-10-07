# WF-ONB-001 — Entrada mínima y progresiva

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 07-10-2026
Blueprint: WeekFlow Blueprint Maestro v4.0

## Problem
WeekFlow ya tiene suficientes módulos para ser útil, pero una instalación nueva entra directamente a Ahora sin contexto. Un onboarding tradicional largo contradiría el principio de reducir carga mental y repetiría datos que cada módulo ya puede pedir cuando sean relevantes.

## Desired behavior
Una instalación realmente nueva ve una sola bienvenida que pide únicamente un nombre opcional y permite elegir entre configurar la semana ahora o entrar a WeekFlow y hacerlo después. El resto de la personalización permanece progresiva y contextual.

Las instalaciones existentes con evidencia de uso real no vuelven a pasar por onboarding al actualizar.

## Roadmap fit
- Phase decision: NOW
- Reason: es el primer bloque canónico de 0.6.x y prepara la entrada progresiva sin adelantar notificaciones ni Brain.

## Scope
- Nueva pantalla `/onboarding` de una sola vista.
- Reutilizar `UserProfile.name`; no crear un perfil paralelo.
- Persistir solamente el estado de onboarding en el key/value SQLite existente.
- Guardar nombre si se proporciona; permitir nombre vacío.
- CTA principal: completar onboarding y abrir Semana.
- CTA secundaria: completar onboarding y entrar a Ahora.
- Ocultar navegación inferior durante onboarding.
- Gate en RootLayout para instalaciones realmente nuevas.
- Compatibilidad de actualización: detectar uso previo significativo y marcar onboarding como completado sin mostrar la pantalla.

## Existing-use evidence
Se considera instalación ya utilizada si existe al menos una de estas señales:
- nombre o nombre de horario guardado;
- una jornada laboral, momento importante o semana organizada;
- historial Move;
- historial Food;
- al menos un hábito creado.

## Non-goals
- Pedir peso, altura, objetivo físico, dieta, sueño o hábitos.
- Pedir permiso de notificaciones.
- Crear cuenta o exigir Firebase Auth.
- Elegir pilar prioritario.
- Configurar recordatorios o silencio inteligente.
- Cambiar lógica de Semana/Move/Food/Rest.
- Smart Import o IA.

## Acceptance criteria
- [ ] AC1 — Instalación nueva sin datos abre `/onboarding` antes de la navegación normal.
- [ ] AC2 — Onboarding cabe en una sola pantalla lógica y no requiere cuenta.
- [ ] AC3 — Nombre es opcional y, si se escribe, usa el `UserProfile` existente.
- [ ] AC4 — “Configurar mi semana” completa onboarding y navega a `/week`.
- [ ] AC5 — “Entrar a WeekFlow” completa onboarding y navega a `/`.
- [ ] AC6 — BottomNav no aparece en `/onboarding`.
- [ ] AC7 — Una instalación con evidencia de uso previo no muestra onboarding al actualizar.
- [ ] AC8 — El estado completado persiste y no vuelve a abrir onboarding.
- [ ] AC9 — No hay migración de esquema SQLite ni cambios destructivos sobre datos existentes.
- [ ] AC10 — Quality y Android release pasan antes de declarar DONE.

## Data / persistence impact
Se añade una clave `onboarding-state` en `weekflow_state`, usando el store key/value existente. No cambia el esquema SQLite.

Formato:
- `completed: boolean`
- `completedAt: string | null`
- `source: 'fresh' | 'legacy'`
- `nextStep: 'week' | 'later' | null`

El nombre sigue almacenado únicamente en `user-profile`.

## UI / UX impact
- Una bienvenida navy/azul coherente con WeekFlow.
- Copy breve: WeekFlow conocerá a la persona poco a poco.
- Teclado no debe tapar las acciones.
- Sin BottomNav ni distracciones durante la bienvenida.
- No lenguaje de productividad, culpa ni configuración obligatoria.

## Edge cases / regressions
- Nombre vacío.
- Nombre con espacios.
- Reinicio después de completar.
- Actualización desde 0.5.5 con semana existente.
- Usuario antiguo con solo historial Move/Food/hábitos.
- Navegar a onboarding manualmente después de completarlo debe devolver a Ahora.
- Nueva instalación que elige “después” debe poder configurar Semana normalmente más tarde.

## Verification plan
- Añadir regresiones puras de detección fresh/legacy y estado completado.
- Añadir prueba estructural de RootLayout/BottomNav/onboarding.
- Ejecutar Quality en PR.
- Fusionar solo con Quality verde.
- Ejecutar Android firmado post-merge y confirmar APK/AAB.
- Prueba física de primera instalación/teclado queda como gate manual si no hay dispositivo disponible.


## Verification result

- AC1: PASS — RootLayout resuelve `shouldShowOnboarding()` y redirige fresh installs a `/onboarding`.
- AC2: PASS — onboarding es una sola pantalla lógica y no integra Auth.
- AC3: PASS — nombre opcional reutiliza `UserProfile.name`; vacío no bloquea.
- AC4: PASS — “Configurar mi semana” completa y navega a `/week`.
- AC5: PASS — “Entrar a WeekFlow” completa y navega a `/`.
- AC6: PASS — RootLayout no renderiza BottomNav en `/onboarding`.
- AC7: PASS — detección legacy cubre perfil, semana, Move, Food y hábitos.
- AC8: PASS — `onboarding-state` persiste `completed` en el store existente.
- AC9: PASS — no se modificó schema/migrations SQLite.
- AC10: PARTIAL — Quality #248 PASS; Android firmado pendiente post-merge.

Additional:
- PASS — recordatorios no se sincronizan mientras onboarding esté pendiente, evitando pedir permiso antes del paso de notificaciones.
- BLOCKED — primera instalación real, teclado y actualización física requieren teléfono/dispositivo y se validarán con el APK candidato.
