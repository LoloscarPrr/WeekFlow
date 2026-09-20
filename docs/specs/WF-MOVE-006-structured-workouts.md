# WF-MOVE-006 — Sesiones estructuradas desde rutinas reales

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 20-09-2026
Source: 8 fotografías de rutinas escritas por el antiguo entrenador del usuario
Blueprint mapping: MOV-08, MOV-09, progresión adaptativa Move

## Source material used

Solo se incorporan elementos legibles con confianza razonable de las pizarras. Entre ellos:
- calentamientos con skipping, jumping jacks, flexiones, sentadilla + salto, mountain climbers, hollow, toque de hombros, movilidad y banda;
- fuerza/hipertrofia con press banca, press inclinado con mancuernas, back squat, peso muerto, peso muerto rumano, remo con barra/unilateral, press de hombro, curls, fondos, extensión de tríceps, zancadas, curl femoral con banda y elevación de talón;
- prescripciones visibles como 4×10, 4×10–12, 5×5, 4×6–8, 3×10 por lado, 3×15 y 4×15–20;
- descanso de 1:30 visible en bloques de fuerza/hipertrofia;
- circuito AMRAP visible con 5 min de trabajo, 2 min de descanso y 3 series/rondas.

Los fragmentos ilegibles o cortados no se convierten en reglas.

## Problem

Move 0.3.24 selecciona ejercicios y adapta dificultad, pero todas las sesiones se ejecutan como intervalos temporizados. Eso impide representar rutinas de fuerza/hipertrofia con series y repeticiones, y circuitos AMRAP como los usados en las referencias del entrenador.

## Desired behavior

- Move soporta tres formatos: Intervalos, Series/repeticiones y Circuito AMRAP.
- En Auto, Move elige el formato según objetivo, enfoque, energía, experiencia y tiempo:
  - fuerza/músculo favorece series;
  - condición/activar puede favorecer circuito;
  - recuperación/movilidad conserva intervalos.
- El usuario puede forzar el formato desde el plan si quiere.
- Series muestra serie actual, total, repeticiones/rango y descanso.
- AMRAP muestra todos los ejercicios/repeticiones del circuito, temporizador de trabajo y descanso entre rondas.
- Las referencias del entrenador informan las plantillas, pero siempre pasan por la compatibilidad actual: equipo, nivel, impacto, zonas evitadas y selección manual ✓/—.
- Feedback previo continúa progresando/regresando ejercicios; no aumenta automáticamente los kg.

## Scope

- Añadir MoveTrainingStyle: auto / intervalos / series / amrap.
- Persistir la preferencia de formato con migración legacy segura.
- Extender MoveStep con prescripción estructurada.
- Crear catálogo de plantillas derivadas de las pizarras con evidencia explícita.
- Añadir ejercicios faltantes legibles de las fotos.
- Añadir Battle Rope como equipo configurable.
- Generar sesiones de series con rangos realistas presentes en las fuentes:
  - fuerza: 5×5 o 4×6–8 cuando la plantilla/ejercicio sea compatible;
  - hipertrofia/general: 4×10, 4×10–12, 3×10/lado, 3×15, 4×15–20;
  - descanso base 90 s en bloques estructurados, adaptable por intensidad/tiempo.
- Generar AMRAP con 5 min trabajo + 2 min descanso; hasta 3 rondas cuando el tiempo disponible alcance.
- Actualizar player y preview.
- Historial guarda trainingStyle.
- Regresiones + versión 0.3.25 + Android release.

## Non-goals

- No copiar cargas personales/RM escritas para otras personas en la pizarra.
- No inferir 1RM ni porcentajes de 1RM.
- No usar nombres ilegibles como ejercicios.
- No imponer exactamente todas las rutinas fotografiadas sin adaptar tiempo/equipo.
- No periodización semanal completa todavía.
- No aumentar automáticamente el peso de mancuernas/barra/kettlebell.
- No usar género ni somatotipo para prescribir.

## Acceptance criteria

- [ ] AC1 — Existe formato Auto / Intervalos / Series / AMRAP y persiste en preferencias.
- [ ] AC2 — Legacy carga como Auto sin pérdida.
- [ ] AC3 — Fuerza/músculo en Auto puede generar series/repeticiones.
- [ ] AC4 — Condición/activar en Auto puede generar AMRAP cuando tiempo e intensidad lo permiten.
- [ ] AC5 — Recuperación/movilidad nunca genera AMRAP exigente.
- [ ] AC6 — Series muestran sets, reps/rango y descanso; el player avanza set por set.
- [ ] AC7 — AMRAP muestra circuito completo, 5 min trabajo y descanso entre rondas.
- [ ] AC8 — Con >=21 min, plantilla AMRAP puede usar 3 rondas de 5+2 min; con menos tiempo reduce rondas sin exceder el plan.
- [ ] AC9 — Plantillas respetan equipo, selección manual, experiencia, impacto y zonas evitadas.
- [ ] AC10 — Se añaden ejercicios legibles faltantes de las fotos y Battle Rope al inventario.
- [ ] AC11 — No se copian los RM/pesos de otras personas ni datos ilegibles.
- [ ] AC12 — Historial guarda el formato de sesión y ejercicios realizados.
- [ ] AC13 — Feedback Muy fácil/Bien/Difícil/Demasiado sigue afectando variantes sin alterar kg automáticamente.
- [ ] AC14 — Quality/TypeScript/regresiones pasan.
- [ ] AC15 — Android release 0.3.25 genera APK + AAB firmados.

## Verification result

- AC1–AC15: PENDING
