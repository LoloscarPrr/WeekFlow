# WF-MOVE-002 — Intensidad y calidad real de Move

Status: DONE
Owner: WeekFlow
Reconciled: 30-09-2026 under Blueprint Maestro v4.0

## Team review
- Diego / Move: la rutina `fuerza` actual empieza con movilidad y no se percibe como fuerza real.
- Mia / UX: cada enfoque debe producir una vista previa claramente distinta.
- Emma / Bienestar: más intensidad no significa castigo; toda sesión conserva salida fácil y respeto por zonas evitadas.
- Gabriel / Arquitectura: extender el catálogo y orden de selección existentes, manteniendo metadatos de equipo/zonas.
- Alex + Daniel / Producto: mejorar calidad de la biblioteca inicial sin convertir Move en una biblioteca masiva sin propósito.

## Problem
El enfoque visible `Fuerza suave` usaba en gran parte ejercicios de movilidad/activación y la elección de enfoque no cambiaba suficientemente el carácter de la sesión.

## Desired behavior
Move diferencia de forma evidente movilidad, equilibrado, activación y fuerza. `Fuerza` prioriza movimientos corporales/de carga compatibles de fuerza general y sigue adaptándose a silla/suelo, equipo y zonas evitadas. `Movilidad` permanece deliberadamente suave.

## Scope implemented
- Enfoque visible `Fuerza` con copy de fuerza general controlada.
- Biblioteca con movimientos propios de fuerza general y acondicionamiento.
- Orden de selección diferenciado por enfoque.
- Metadatos de equipo, nivel, impacto y zonas corporales.
- Alternativa fácil y cambio de ejercicio compatible.
- Regresiones que distinguen fuerza, activación y movilidad.

## Non-goals
- No crear una biblioteca masiva solo por volumen.
- No diagnosticar lesiones ni prescribir rehabilitación.
- No clasificar por somatotipo.

## Acceptance criteria
- [x] AC1 — El enfoque visible se llama `Fuerza` y su copy describe fuerza general controlada.
- [x] AC2 — La preview de fuerza prioriza movimientos de fuerza real compatibles.
- [x] AC3 — `Fuerza` no empieza con movilidad pura salvo fallback por restricciones.
- [x] AC4 — `Activarme` prioriza movimiento dinámico y se distingue de `Movilidad`.
- [x] AC5 — `Movilidad` mantiene movimientos suaves/rango cómodo.
- [x] AC6 — Zonas evitadas y restricciones de silla/suelo/equipo siguen filtrando incompatibles.
- [x] AC7 — Cambiar ejercicio conserva la misma lógica de compatibilidad.
- [x] AC8 — Tests Move y Quality actuales pasan.
- [x] AC9 — El cambio quedó documentado en 0.3.14 y permanece en la línea firmada actual; Android #155 (0.4.6) prueba que la implementación vigente sigue compilando como release firmado.

## Verification evidence
- `tests/move-adaptation.test.ts` comprueba fuerza real, previews distintas para Activarme/Movilidad, duración, equipo, nivel, zonas evitadas y swap compatible.
- `src/move/adaptation.ts` mantiene `Fuerza`, `Activarme`, `Movilidad` y adaptación de intensidad/duración.
- `CHANGELOG-0.3.14.md` documenta el cambio enviado.
- Main Quality #206: PASS.
- Main Android #155: PASS.

## Verification result
AC1–AC9: PASS.

Spec reconciliada contra el estado vigente; no se añadieron funciones nuevas para cerrarla.
