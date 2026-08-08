# WeekFlow

**Tu semana. Tu ritmo. Tu equilibrio.**

## v4.8.1 — Brain nativo real

Esta versión continúa la migración iniciada en v4.8.0 y mueve la lógica real de planificación a `src/brain`.

### Qué cambia

- `src/brain/types.ts` define el contrato nativo del Brain.
- `src/brain/engine.ts` genera planes reales para:
  - días de trabajo,
  - turnos nocturnos,
  - días libres.
- El Brain calcula hacia atrás desde la hora de entrada:
  - despertar,
  - comida,
  - preparación,
  - salida,
  - traslado.
- Ida y regreso se manejan como tiempos independientes.
- La energía (`vigoroso`, `bien`, `cansado`, `agotado`) modifica el plan.
- `app/index.tsx` ya consume `BrainPlan`; deja de ser una pantalla de demostración con lógica escrita a mano.

### Principio de producto

WeekFlow se adapta al usuario, no al revés. El trabajo y los compromisos fijos son anclas; descanso, alimentación y traslado se protegen antes de colocar lo flexible.

### Siguiente etapa

Persistencia del estado real del usuario y conexión completa de Día Vivo / `Ya salí` con el Brain nativo.
