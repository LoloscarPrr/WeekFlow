# WF-UX-004 — Microanimaciones Lottie en confirmaciones de Move y Semana

Status: LOCKED
Owner: WeekFlow
Date: 2026-11-24
Blueprint: WeekFlow Maestro v4.0 (flujo del usuario, feedback real de Move, Semana canónica)
Phase decision: NOW — piloto visual acotado tras consolidación; no abrir nuevos módulos.

## Problem
Las confirmaciones de Move y del ritual semanal son estáticas. Se desea una respuesta visual breve, pero animaciones permanentes o no asociadas a resultados reales pueden consumir recursos, interferir con accesibilidad o inducir confusión respecto al estado guardado.

## Desired behavior
- Al terminar **realmente** una sesión Move completa, el componente existente de feedback muestra una microanimación Lottie local de confirmación **una sola vez**.
- Si la sesión acaba anticipadamente, el icono es estático y el texto sigue diciendo "Listo por hoy", sin celebración de "Sesión completada".
- Al pulsar "Listo, organizar semana" aparece la misma animación una vez sobre la tarjeta ya guardada de Semana. Nunca se anima al recargar ni por abrir una semana previamente organizada.
- Ninguna animación se repite continuamente. No hay red, sonido, notificación, haptic ni telemetría nueva.
- Si Android pide reducir movimiento, se muestra confirmación estática; las etiquetas son legibles y la interfaz sigue operable.
- Assets originales Lottie JSON simples sin imágenes externas y respetuosos con branding existente. Duración 1–1.2 s.

## Roadmap and scope
NOW — mejora UI de confirmaciones en dos superficies ya estabilizadas. Todo el resto queda BACKLOG.
- Añadir `lottie-react-native@~7.3.8` (versión alineada con Expo SDK 57) con npm package-lock consistente y sus dependencias transitivas en CI.
- Componente `src/components/CompletionAnimation.tsx` reutilizable, asset `assets/animations/weekflow-complete.json`, tamaño compacto, one-shot, reduced-motion, estático fallback.
- Hook ephemeral en Move para mostrar exclusivamente al completar una sesión nueva (nunca por historial restaurado).
- Hook ephemeral en Semana después del botón real de confirmación, sin afectar estados de dos semanas ni preview.
- Regression structure + asset validation + Quality, Metro y APK Android firmada.

## Non-goals
- No Lottie splash de inicio, no animación de ejercicios ni rutinas ilustradas; no falsear técnica de ejercicio.
- No video, streaming, assets remotos ni loops en pantalla de Ahora, Move player/contador o navegación.
- No modificar Brain, intensidad, timers, persistencia SQLite, feedback, permisos, API, crash reporting, datos ni firma Android.
- No reclamar ahorro de batería o FPS medidos sin pruebas físicas.

## Acceptance criteria
1. Lottie JSON local válido, original, dimensiones y duración acotadas, sin URL/assets externos ni loop.
2. Componente respeta reducir movimiento mostrando ✓ estático, con accesibilidad y texto visible; animación no afecta controles ni oculta estado final.
3. Move anima solo cuando nueva sesión finalizó completa; cierre anticipado y feedback pendiente desde SQLite no disparan Lottie.
4. Semana anima solo cuando se pulsa confirmar ritual, una vez; recargar, navegar o cambiar de semana no genera replays indebidos ni un doble guardado.
5. Dependencia correcta para Expo 57 y lockfile reproducible `npm ci`; no se restaura un lockfile vulnerable anterior.
6. Regresiones de Move/Week/notifications/Brain permanecen en verde; Calidad/TypeScript y Metro Android pasan.
7. Build firmado de Android publica v0.5.42 con `com.weekflow.app`, firma existente y versionCode monotónico; QA de upgrade y rendimiento en Redmi documentado si no accesible.
8. Sin migración de datos, sin configuraciones Android adicionales ni efectos de red/telemetría.

## Persistence / compatibility
Solo flag en memoria de microanimación; nunca se persiste. Modelo de sesión / semana, SQLite y preferencias quedan intactos. Versionado app/package/lock/test pasa de 0.5.41 a 0.5.42 para distribuir módulo nativo adicional.

## UI, performance and accessibility
One-shot (<1.5s), tamaño compacto de 64–76 pt, app azul/verde, fallback texto ✓, sin scroll adicional, botón y feedback accesibles. Respetar `AccessibilityInfo.isReduceMotionEnabled()`. No iniciar animación en segundo plano o si el resultado se recupera de SQLite.

## Edge cases and tests
- Move finalizó y usuario vuelve a la pantalla; reabrir aplicación no vuelve a animar.
- Move detenido anticipadamente.
- Semana ya organizada / cambiar pestaña / no duplicar guardado.
- Accesibilidad reduce-motion true y consulta fallida.
- Lottie instalado como módulo nativo (no Expo Go demo), lockfile consistente.
- Segunda semana sin preparar y confirmedAt equivalente; no tocar planificador.

## Verification plan
1. Tests Node estructurales de asset y render/flags.
2. `npm ci`, TypeScript, regression suite, Metro Android.
3. Build Android firmado tras merge; prueba real reducción de movimiento/batería/instalación y captura de visual en Redmi = BLOCKED si no hay dispositivo.
4. AC reportados como PASS/BLOCKED, con enlace a PR/CI.

## Verification results
PENDING.
