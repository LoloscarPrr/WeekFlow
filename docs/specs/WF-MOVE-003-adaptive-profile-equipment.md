# WF-MOVE-003 — Perfil adaptativo y equipamiento real

Status: DONE
Owner: WeekFlow
Blueprint mapping: MOV-08, MOV-09

## Problem
Move ya recomienda una duración a partir de energía, jornada y feedback previo, y ya respeta enfoque, suelo/silla y zonas a evitar. Sin embargo, dos personas con objetivos, experiencia y equipamiento distintos todavía pueden recibir prácticamente la misma sesión. Además, tener pesas disponibles no modifica la biblioteca porque el modelo actual solo conoce `none/chair/floor`.

El usuario pidió que las rutinas se construyan según nivel de energía, peso/contexto físico, objetivo y herramientas reales disponibles, incluyendo el peso de las cargas.

## Desired behavior
Move mantiene una sola lógica adaptativa y añade un perfil de entrenamiento persistente. La sesión del día combina:
- energía canónica del día;
- feedback y finalización de la sesión anterior;
- experiencia declarada;
- objetivo base;
- peso/altura opcionales como contexto, sin clasificar el cuerpo;
- tiempo elegido/recomendado;
- equipamiento realmente declarado y sus cargas cuando corresponda;
- enfoque puntual de la sesión, suelo/silla y zonas que el usuario prefiere no cargar.

La energía no solo cambia minutos: también cambia la densidad de trabajo/descanso. El equipamiento declarado habilita variantes con carga; el equipamiento ausente nunca aparece. El peso corporal puede moderar la prioridad/frecuencia de variantes con carga en relación con la carga externa declarada, pero no se usa para diagnosticar, calcular somatotipos ni decidir que una carga es “segura”.

## Scope
- Extender `MovePreferences` con perfil Move backward-compatible:
  - experiencia: sin definir / principiante / intermedio / avanzado;
  - objetivo: bienestar / fuerza / músculo / condición / movilidad;
  - peso corporal opcional en kg;
  - altura opcional en cm;
  - mancuernas con kg por mancuerna;
  - kettlebell con kg;
  - bandas de resistencia.
- Añadir controles compactos en el plan Move para editar ese perfil.
- Derivar una intensidad `recuperación/suave/moderada/alta` desde energía + experiencia + feedback/abandono previo.
- Mantener la duración total exacta, variando la proporción trabajo/descanso según intensidad.
- Extender la biblioteca con un conjunto pequeño de ejercicios con mancuernas, kettlebell y banda.
- Hacer que objetivo, experiencia, intensidad y equipamiento alteren la selección/orden de ejercicios.
- Usar el peso corporal únicamente para contextualizar la carga externa relativa y moderar cuántas variantes cargadas se priorizan; sin etiquetas corporales.
- Mostrar la carga/equipo registrado en la guía cuando el ejercicio lo use.
- Mantener la misma compatibilidad para generación, preview y “Cambiar ejercicio”.
- Persistir la intensidad elegida al iniciar una sesión para que una sesión activa no cambie de densidad si cambia el estado diario fuera del player.
- Ampliar regresiones de Move.

## Non-goals
- No usar ni mostrar `ectomorfo`, `mesomorfo`, `endomorfo`, BMI/IMC ni categorías de peso.
- No diagnosticar lesiones, obesidad, condición médica, capacidad cardiovascular ni aptitud física.
- No prescribir rehabilitación.
- No calcular calorías quemadas ni déficit energético.
- No aumentar automáticamente kg entre sesiones ni prescribir 1RM/RPE/RIR en esta spec.
- No añadir barra olímpica, máquinas, wearables, cámara ni entrenador por voz.
- No convertir Move en un plan semanal de musculación; esta spec mejora la sesión adaptativa del día.
- No cambiar navegación, Food, Semana, Sueño ni el modelo canónico de energía.

## Acceptance criteria
- [x] AC1 — El plan Move permite declarar experiencia, objetivo, peso/altura opcionales y equipo disponible: mancuernas con kg por unidad, kettlebell con kg y bandas.
- [x] AC2 — El perfil se persiste dentro de las preferencias existentes; datos legacy sin los nuevos campos cargan con defaults seguros y siguen funcionando sin migración SQLite.
- [x] AC3 — La intensidad se deriva de los cuatro niveles canónicos de energía y se reduce ante feedback `Difícil`, `Demasiado` o una sesión terminada antes; `vigoroso` solo llega a intensidad alta cuando la experiencia declarada lo permite.
- [x] AC4 — A igual duración, intensidad recuperación/suave dedica más tiempo relativo al descanso que moderada/alta, manteniendo exactamente 5/10/20/30 minutos totales.
- [x] AC5 — Un equipo no declarado nunca aparece en rutina, preview ni swap. Si se declaran mancuernas, kettlebell o banda, Move puede incorporar ejercicios compatibles con ese equipo.
- [x] AC6 — Objetivo y experiencia cambian la selección: fuerza/músculo pueden priorizar variantes con carga compatibles; condición favorece movimiento continuo; movilidad favorece rango cómodo. Un enfoque explícito del día sigue teniendo prioridad sobre el objetivo base.
- [x] AC7 — Cuando peso corporal y carga externa están disponibles, la relación entre ambas solo modera la prioridad/frecuencia de variantes cargadas. No se muestra ni persiste ninguna clasificación corporal o conclusión médica.
- [x] AC8 — Los ejercicios con carga muestran qué equipo/carga registrada usar; si la carga no se siente controlable, el copy orienta a cambiar ejercicio en vez de obligar a usarla.
- [x] AC9 — Suelo/silla, zonas a evitar y experiencia siguen siendo filtros de compatibilidad compartidos por generación, preview y “Cambiar ejercicio”; los fallbacks nunca reintroducen una restricción bloqueada.
- [x] AC10 — La intensidad queda guardada en la sesión activa de forma backward-compatible y se conserva al terminar en el historial cuando está disponible.
- [x] AC11 — Pausa, progreso, terminar antes, feedback, historial y duración recomendada mantienen su comportamiento previo salvo la adaptación explícita definida aquí.
- [x] AC12 — TypeScript y regresiones completas pasan; `move-adaptation.test.ts` cubre migración legacy, intensidad, densidad, objetivo, experiencia, equipo, carga relativa, restricciones y swap. El build Android release debe pasar antes de marcar DONE.

## Data / persistence impact
`MovePreferences` continúa guardándose como JSON en `move-preferences`; se amplía y `sanitizeMovePreferences` rellena los campos nuevos cuando faltan. No hay migración de tablas SQLite.

`ActiveMoveSession` y `MoveSessionRecord` reciben `intensity` opcional. La carga de sesiones históricas/activas sin ese campo conserva compatibilidad y usa la intensidad derivada cuando sea necesario.

## UI / UX impact
- Nueva sección compacta “Tu perfil Move” dentro del plan.
- Objetivo y experiencia usan controles seleccionables; peso/altura y cargas usan entrada numérica.
- “Equipo disponible” solo considera una herramienta presente cuando su toggle/carga válida está declarada.
- La preview se actualiza inmediatamente porque sigue derivándose de la misma función de rutina.
- `MoveHome` ya usa `KeyboardAvoidingView` y scroll con `keyboardShouldPersistTaps="handled"`; los campos numéricos deben convivir con ese patrón sin crear un modal nuevo.

## Edge cases / regressions
- Preferencias antiguas sin perfil/equipment.
- Valores numéricos vacíos, negativos, NaN o excesivos: se normalizan a `null`, no rompen el plan.
- Peso ausente: la rutina sigue usando objetivo/experiencia/equipo sin aplicar heurística de carga relativa.
- Equipo con carga ausente: no se considera disponible.
- Energía `agotado`: no debe priorizar ejercicios con carga externa.
- Principiante + `vigoroso`: intensidad máxima moderada.
- Todas las zonas evitadas: fallback compatible sigue disponible.
- Equipo registrado pero bloqueado por zona: no reaparece por swap.
- Una sesión activa legacy sin `intensity` sigue cargando.
- Una sesión nueva conserva la intensidad con la que se inició.

## Verification plan
- [x] Revisar diff de `adaptation.ts`, `library.ts`, controlador, UI, persistence y tests.
- [x] Ejecutar `npm run typecheck`.
- [x] Ejecutar `npm test` / Quality completo.
- [x] Verificar en tests las cuatro densidades con duración exacta.
- [x] Verificar que previews y swaps no usen equipo ausente ni zonas bloqueadas.
- [x] Verificar sanitización de preferencias legacy y de campos numéricos inválidos.
- [x] Generar build Android release y confirmar resultado antes de `DONE`.
- [ ] La ergonomía final de inputs/teclado queda pendiente de confirmación física en Android si no existe automatización de UI.

## Verification result
- AC1: PASS — perfil editable con objetivo, experiencia, peso/altura y equipo/cargas.
- AC2: PASS — persistencia backward-compatible mediante sanitización de preferencias.
- AC3: PASS — intensidad adaptada por energía, experiencia y feedback/finalización previa.
- AC4: PASS — densidad trabajo/descanso cambia manteniendo duración exacta.
- AC5: PASS — equipo ausente queda excluido de rutina, preview y swap.
- AC6: PASS — objetivo, experiencia e intensidad alteran selección/prioridad.
- AC7: PASS — peso corporal se usa solo como contexto relativo de carga.
- AC8: PASS — guía de ejercicios cargados muestra equipo/carga registrada.
- AC9: PASS — restricciones de suelo/silla/zonas se mantienen en generación y swap.
- AC10: PASS — intensidad persiste en sesión activa/historial de forma compatible.
- AC11: PASS — regresiones conservan pausa, progreso, feedback e historial.
- AC12: PASS — Quality PR #154, Quality main #155 y Android release #139 completados con éxito.

### Evidence
- Main commit: `9aac648896b3efc0ded92e99d8bf5ad52ea6826a`.
- Android workflow #139: PASS, incluyendo signed release APK + AAB, upload de artifacts y publicación en GitHub Releases.
- Artifact: `WeekFlow-Alpha-v0.3.19-Standalone-APK`.
- Artifact: `WeekFlow-Alpha-v0.3.19-Play-AAB`.
- La ergonomía física final de inputs/teclado queda para validación manual en Android; no bloquea el cierre funcional de esta spec.
