# WF-WEEK-006 — Ocultar importación heredada hasta Smart Import

Status: VERIFYING
Owner: WeekFlow
Approved scope: Oscar · 30-09-2026
Blueprint: WeekFlow Blueprint Maestro v4.0
Roadmap target: Smart Import + WeekFlow Brain hacia el bloque final

## Problema
El botón `Importar horario` sigue visible en Semana aunque la decisión canónica nueva congela la importación tradicional OCR/Excel/PDF. Mantener el acceso expone una experiencia que ya no se quiere perfeccionar ahora y contradice el roadmap actualizado.

## Comportamiento deseado
- Semana deja de mostrar `Importar horario`.
- La edición manual de los 7 días permanece como flujo oficial actual.
- No se borra el código OCR/Excel/PDF ni sus pruebas existentes.
- La ruta `/import` puede permanecer internamente mientras no exista una entrada visible desde Semana.
- La importación automática volverá como Smart Import conectado a WeekFlow Brain, con interpretación multimodal, propuesta revisable y confirmación humana antes de reorganizar la semana.

## Non-goals
- No seguir corrigiendo OCR heredado.
- No rediseñar Excel/PDF.
- No borrar parsers ni datos existentes.
- No implementar IA en esta build.
- No cambiar la edición manual ni el Ritual de la Semana.

## Acceptance criteria
- [x] AC1 — `app/week.tsx` no muestra `Importar horario`.
- [x] AC2 — Semana ya no navega a `/import` desde su UI.
- [x] AC3 — Edición manual de jornadas, Evento importante y Ritual siguen presentes.
- [x] AC4 — Código OCR/Excel/PDF no se elimina.
- [x] AC5 — La regresión de Semana exige que el importador heredado permanezca oculto.
- [ ] AC6 — Quality PR + main pasan.
- [ ] AC7 — Android 0.4.8 genera APK/AAB firmado y conserva actualización sobre la build anterior.

## Verification result
Pendiente de CI y build Android.
