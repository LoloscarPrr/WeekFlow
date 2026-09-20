# WF-MOVE-005 — Selección manual de ejercicios

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 19-09-2026
Source: prueba física de WeekFlow Alpha 0.3.23 + capturas de Biblioteca Move
Blueprint mapping: MOV-08, MOV-09, preferencias de biblioteca

## Problem

La Biblioteca Move muestra qué ejercicios son compatibles con el perfil actual mediante ✓ y cuáles no lo son mediante —, pero esos símbolos son informativos. El usuario quiere decidir manualmente qué ejercicios compatibles pueden entrar en sus rutinas y poder excluir cualquiera por preferencia personal, ya sea porque se siente demasiado simple, demasiado difícil o simplemente no quiere hacerlo.

## Desired behavior

- El nivel/experiencia, energía, restricciones y equipo siguen definiendo qué ejercicios son compatibles.
- Dentro del conjunto compatible, cada ejercicio queda permitido por defecto.
- El usuario puede tocar el control del ejercicio para alternar:
  - ✓ permitido: Move puede seleccionarlo;
  - — excluido por el usuario: Move no lo usará en generación, progresión ni “Cambiar ejercicio”.
- Un ejercicio incompatible por equipo, experiencia, intensidad, impacto o restricciones no puede forzarse manualmente desde la biblioteca.
- La selección manual solo estrecha el pool; nunca invalida reglas de seguridad/compatibilidad.
- La preferencia persiste entre sesiones y reinicios.
- Si el usuario excluye una progresión más difícil, “Muy fácil” debe buscar otra progresión permitida o conservar la mejor opción compatible restante.
- Si una familia queda sin variantes permitidas, Move usa otra familia compatible/fallback sin reintroducir un ejercicio excluido.
- La biblioteca muestra claramente el estado: permitido, excluido por mí o no compatible.

## Scope

- Ampliar MovePreferences con `excludedExerciseIds: string[]`, backward-compatible.
- Añadir sanitización contra IDs inexistentes.
- Integrar la exclusión en la función de compatibilidad compartida por:
  - generación;
  - preview;
  - progresión/regresión;
  - “Cambiar ejercicio”;
  - filtro de Biblioteca Move.
- Hacer interactivo el control ✓/— en ejercicios compatibles.
- Añadir copy de estado y contador de ejercicios permitidos/excluidos.
- Mantener el filtro “Solo compatibles con mi perfil actual”.
- Añadir acción “Restablecer selección” para volver a permitir todos los ejercicios compatibles.
- Bump 0.3.24 + Quality + Android release.

## Non-goals

- No permitir forzar ejercicios incompatibles.
- No crear listas separadas por género ni somatotipo.
- No añadir una razón obligatoria al excluir.
- No cambiar automáticamente las cargas registradas.
- No convertir la selección manual en un programa semanal fijo.

## Acceptance criteria

- [ ] AC1 — Preferencias legacy cargan con `excludedExerciseIds=[]`.
- [ ] AC2 — IDs inválidos/obsoletos se eliminan al sanitizar.
- [ ] AC3 — Un ejercicio excluido no aparece en rutina ni preview.
- [ ] AC4 — “Cambiar ejercicio” nunca devuelve un ejercicio excluido.
- [ ] AC5 — Progresión “Muy fácil” no puede reintroducir un ejercicio excluido.
- [ ] AC6 — Regresión “Difícil/Demasiado” tampoco puede reintroducir un excluido.
- [ ] AC7 — Biblioteca permite alternar ✓/— solo para ejercicios compatibles.
- [ ] AC8 — Ejercicios incompatibles muestran estado bloqueado y no se pueden forzar.
- [ ] AC9 — Existe “Restablecer selección”.
- [ ] AC10 — La selección persiste en SQLite vía MovePreferences.
- [ ] AC11 — Quality/TypeScript/regresiones pasan.
- [ ] AC12 — Android release 0.3.24 genera APK + AAB firmados.

## Verification result

- AC1–AC12: PENDING
