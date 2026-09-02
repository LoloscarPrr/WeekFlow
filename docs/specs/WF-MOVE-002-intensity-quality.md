# WF-MOVE-002 — Intensidad y calidad real de Move

Status: LOCKED
Owner: WeekFlow

## Team review
- Diego / Move: la rutina `fuerza` actual empieza con movilidad y no se percibe como fuerza real.
- Mia / UX: cada enfoque debe producir una vista previa claramente distinta.
- Emma / Bienestar: más intensidad no significa castigo; toda sesión conserva salida fácil y respeto por zonas evitadas.
- Gabriel / Arquitectura: extender el catálogo y orden de selección existentes, manteniendo metadatos de equipo/zonas.
- Alex + Daniel / Producto: mejorar calidad de la biblioteca inicial sin convertir 0.3.x en una biblioteca masiva.

## Problem
El enfoque visible `Fuerza suave` usa en gran parte ejercicios de movilidad/activación (`Círculos de hombros`, `Elevación de talones`, `Empuje en pared`, `Alcances suaves`). La elección de enfoque no cambia suficientemente el carácter de la sesión y la preview puede sentirse demasiado ligera.

## Desired behavior
Move debe diferenciar de forma evidente movilidad, equilibrado, activación y fuerza. `Fuerza` debe priorizar movimientos corporales de fuerza general y seguir adaptándose a silla/suelo y zonas evitadas. `Movilidad` puede mantenerse deliberadamente suave.

## Scope
- Renombrar el enfoque visible `Fuerza suave` a `Fuerza`.
- Mejorar la biblioteca inicial con un conjunto acotado de ejercicios propios de fuerza general y acondicionamiento.
- Reordenar `FOCUS_ORDER` para que cada enfoque tenga identidad clara.
- Mantener `MoveExercise` con metadatos de necesidades y zonas corporales.
- Mantener alternativa fácil (`easier`) y cambio de ejercicio.
- Añadir regresiones que verifiquen que una preview de fuerza contiene movimientos de fuerza reales y no comienza con movilidad pura.
- Liberar como WeekFlow 0.3.14 si Quality y build nativo pasan.

## Non-goals
- No crear una biblioteca masiva ni planes de musculación avanzados.
- No introducir cargas externas nuevas, cámara, wearables ni entrenador por voz.
- No diagnosticar lesiones ni prescribir rehabilitación.
- No cambiar el BottomNav: revisión de código confirma que no está posicionado como overlay; la captura no demuestra una superposición funcional.

## Acceptance criteria
- [ ] AC1 — El enfoque visible se llama `Fuerza` y su copy describe fuerza general controlada.
- [ ] AC2 — La preview de fuerza prioriza movimientos como sentadilla, zancada/variante, bisagra, flexión/plancha o puente según preferencias.
- [ ] AC3 — `Fuerza` no empieza con `Círculos de hombros` ni `Alcances suaves` salvo fallback por restricciones.
- [ ] AC4 — `Activarme` prioriza movimiento continuo/condicionamiento y se distingue de `Movilidad`.
- [ ] AC5 — `Movilidad` mantiene movimientos de rango cómodo y baja intensidad.
- [ ] AC6 — Las zonas evitadas y restricciones de silla/suelo siguen filtrando ejercicios incompatibles.
- [ ] AC7 — Cambiar ejercicio conserva la misma lógica de compatibilidad.
- [ ] AC8 — Tests de Move y Quality pasan.
- [ ] AC9 — Versión/changelog de 0.3.14 actualizados y build Android release pasa antes de marcar DONE.

## Verification plan
- [ ] Revisar diff de catálogo y adaptación.
- [ ] Ejecutar `move-adaptation.test.ts` ampliado.
- [ ] Ejecutar Quality completo.
- [ ] Generar APK release desde `main` tras merge.

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
