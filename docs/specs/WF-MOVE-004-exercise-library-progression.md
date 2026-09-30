# WF-MOVE-004 — Biblioteca de ejercicios y progresión por feedback

Status: DONE
Owner: WeekFlow
Approved by: Oscar · 19-09-2026
Reconciled: 30-09-2026 under Blueprint Maestro v4.0

## Problem
Move ya adaptaba duración, densidad e intensidad, pero necesitaba una biblioteca amplia y que el feedback final afectara explícitamente la dificultad concreta de los ejercicios usados.

## Desired behavior
- Biblioteca amplia y visible con patrón, familia, dificultad, equipo, posición, impacto y requisitos.
- Selección inclusiva por capacidad/contexto real, nunca por género o somatotipo.
- Persistencia de ejercicios realizados.
- Progresión/regresión por feedback dentro de familias compatibles.
- Respeto permanente por equipo real, cargas declaradas, bajo impacto, silla/suelo, zonas evitadas y exclusiones manuales.
- Biblioteca navegable para explorar y excluir ejercicios.

## Scope implemented
- Catálogo Move separado de la lógica de generación, hoy superior a 100 ejercicios.
- Inventario ampliado de equipo y cargas declaradas.
- Preferencia de bajo impacto.
- Familias/progresiones y dificultad 1–5.
- Persistencia de `exerciseIds` en sesiones nuevas manteniendo historial legacy.
- Progresión/regresión por feedback.
- Pantalla `Biblioteca Move` con compatibilidad y selección manual.
- Preview/player/cambio de ejercicio usando la misma compatibilidad.

## Non-goals
- No rehabilitación ni tratamiento clínico.
- No género/somatipos como selector.
- No cálculo 1RM ni subida automática de kg.
- No programa avanzado periodizado de hipertrofia.

## Acceptance criteria
- [x] AC1 — Catálogo exportado con más de 40 ejercicios y metadatos de patrón/familia/dificultad/equipo.
- [x] AC2 — Catálogo cubre bodyweight, silla/suelo y categorías de equipo definidas.
- [x] AC3 — No existen restricciones por género/somatotipo; el contexto real gobierna compatibilidad.
- [x] AC4 — Preferencias legacy migran sin inventar equipo ni perder cargas previas.
- [x] AC5 — Perfil Move permite registrar equipo ampliado y bajo impacto.
- [x] AC6 — Sesiones nuevas persisten IDs de ejercicios; historial legacy sigue funcionando.
- [x] AC7 — `Muy fácil` intenta progresar dificultad/familia compatible.
- [x] AC8 — `Difícil` y `Demasiado` regresan dificultad; `Demasiado` además reduce intensidad/duración.
- [x] AC9 — `Bien` mantiene aproximadamente el nivel.
- [x] AC10 — Progresión/regresión respeta equipo, experiencia, intensidad, impacto, silla/suelo, zonas evitadas y exclusiones.
- [x] AC11 — Recuperación no introduce cargas externas exigentes ni alto impacto.
- [x] AC12 — Biblioteca Move navegable con compatibilidad/selección manual.
- [x] AC13 — Preview, player y `Cambiar ejercicio` comparten compatibilidad.
- [x] AC14 — Quality/TypeScript/regresiones actuales pasan.
- [x] AC15 — El comportamiento permanece en la línea firmada actual; Android #155 (0.4.6) genera release firmado con esta implementación incluida.

## Data / persistence impact
- `MovePreferences` conserva equipo ampliado, `lowImpactOnly` y exclusiones como JSON backward-compatible.
- `MoveSessionRecord` admite `exerciseIds` sin cambio de esquema SQLite.

## Verification evidence
- `tests/move-library-progression.test.ts` valida tamaño/metadatos del catálogo, equipo, migración legacy, progresión/regresión, bajo impacto, selección manual y swaps.
- `tests/move-adaptation.test.ts` valida energía, experiencia, feedback, duración/intensidad, equipo/cargas y restricciones.
- `CHANGELOG-0.3.23.md` documenta biblioteca/progresión; 0.3.24 añade selección manual; 0.3.25 añade sesiones estructuradas y amplía la biblioteca.
- Main Quality #206: PASS.
- Main Android #155: PASS.

## Verification result
AC1–AC15: PASS.

Spec reconciliada contra el estado vigente; no se añadió complejidad nueva para cerrarla.
