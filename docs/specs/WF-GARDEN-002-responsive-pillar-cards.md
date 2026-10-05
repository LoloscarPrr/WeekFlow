# WF-GARDEN-002 — Tarjetas de Jardín responsivas

Status: LOCKED

## Problem
En teléfonos angostos, el estado lateral de un pilar puede quitar demasiado ancho al título y provocar cortes antinaturales como `Alimentaci / ón`. Las tarjetas sin datos también ocupan más altura de la necesaria.

## Desired behavior
Jardín debe conservar los nombres completos de los pilares y una jerarquía clara en pantallas angostas y con texto grande. El estado debe ceder espacio antes que romper el nombre del pilar. Las tarjetas `Sin datos` deben ser algo más compactas sin perder legibilidad.

## Scope
- Reorganizar la jerarquía interna de las tarjetas de Jardín.
- Título y flecha ocupan una fila propia.
- Evidencia y estado usan una fila flexible que puede envolver.
- Compactar ligeramente tarjetas `Sin datos`.
- Mantener los estados actuales y las fuentes reales de datos.

## Non-goals
- No cambiar cálculos de Movimiento, Food o Rest.
- No agregar datos a Relaciones, Bienestar, Hogar, Responsabilidades o Tiempo personal.
- No cambiar Hábitos, reprogramación, persistencia ni navegación.
- No introducir scores, porcentajes ni rachas.

## Acceptance criteria
1. `Alimentación`, `Responsabilidades` y `Tiempo personal` no compiten horizontalmente con el chip de estado en la misma fila del título.
2. La flecha interactiva permanece visible sin empujar el título a un ancho mínimo absurdo.
3. Evidencia y estado pueden envolverse de forma natural en pantallas angostas.
4. `Sin datos` conserva su significado neutral y las tarjetas correspondientes usan una altura mínima menor que las tarjetas con evidencia real.
5. No cambia la lista de ocho pilares ni sus rutas existentes.
6. No cambia ninguna fuente de datos ni persistencia.
7. Las regresiones estructurales cubren la nueva jerarquía responsive.

## Data / persistence impact
Ninguno.

## UI / UX impact
Solo layout de tarjetas en Jardín.

## Edge cases
- Fuente del sistema grande.
- Estado `Necesita atención`.
- Títulos largos.
- Pilar con y sin flecha.
- Evidencia de varias líneas.

## Verification plan
- Typecheck.
- Regresiones existentes.
- Test estructural de Jardín actualizado.
- Android release build.
- Prueba física posterior en Redmi con tamaño de texto actual y aumentado.
