# WF-REST-001 — Pausas de descanso contextuales

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 30-09-2026
Blueprint: WeekFlow Blueprint Maestro v4.0
Roadmap target: 0.4.x — Rest completo

## Problem
Rest ya calcula descanso principal desde turnos reales, traslado, recuperación post-noche y transiciones, pero todavía no ofrece siestas/pausas cortas cuando la energía viene baja y existe margen real antes del siguiente turno.

## Desired behavior
- Energía `cansado` o `agotado` puede producir una pausa opcional corta.
- La pausa solo aparece si existe margen suficiente antes del sueño principal y del próximo despertar requerido.
- Nunca reemplaza ni compite con la ventana principal de sueño.
- `cansado` propone 20 min; `agotado`, 30 min.
- Energía normal no inventa siestas.
- La sugerencia es opcional, no médica y no bloquea otras acciones.
- Recuperación post-turno nocturno mantiene prioridad sobre cualquier siesta corta.

## Scope
- Lógica pura en `restPlanning.ts`.
- Exponer la pausa desde `getRestView`.
- Mostrarla dentro del plan Rest actual sin crear otra pantalla.
- Añadir regresiones de guardrails.
- Bump técnico a 0.4.8 / source Android versionCode 90.

## Non-goals
- Diagnóstico o tratamiento de sueño.
- Duración de sueño personalizada en esta build.
- Alarmas inteligentes o supresión de notificaciones en esta build.
- Wearables, sensores o IA.
- Cambios a Semana, Move o Food.

## Acceptance criteria
- [x] AC1 — Energía `cansado` con margen suficiente propone 20 min.
- [x] AC2 — Energía `agotado` con margen suficiente propone 30 min.
- [x] AC3 — Energía `bien/vigoroso` no propone pausa.
- [x] AC4 — Si el sueño principal está cerca, no aparece una siesta que compita con él.
- [x] AC5 — Durante la ventana principal de sueño no se reemplaza por una pausa corta.
- [x] AC6 — La sugerencia queda suficientemente separada del despertar requerido.
- [x] AC7 — Recuperación nocturna existente no cambia.
- [x] AC8 — UI deja claro que es opcional y conserva el plan principal.
- [ ] AC9 — Quality PR + main pasan.
- [ ] AC10 — Android 0.4.8 genera APK/AAB firmados.

## Verification
- `tests/rest-view.test.ts` cubre noche + pausas contextuales + guardrails.
- Suite completa Quality.
- Build release Android firmado post-merge.
