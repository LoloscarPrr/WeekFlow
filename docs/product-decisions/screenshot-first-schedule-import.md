# Semana: importación automática diferida a WeekFlow Brain

## Decisión vigente · 30-09-2026

La importación automática tradicional de horarios queda **congelada** durante las fases actuales.

Por ahora:

- Semana se organiza manualmente mediante los 7 días editables.
- `Importar horario` no se muestra en la interfaz principal.
- OCR, Excel y PDF existentes se conservan en el repositorio, pero no guían el roadmap ni reciben nuevas mejoras salvo una necesidad de compatibilidad crítica.
- No se invierten nuevas builds en heurísticas, regex o excepciones específicas de planillas.

La importación vuelve más adelante como **Smart Import**, integrada con WeekFlow Brain:

1. el usuario entrega una foto, captura, PDF u otro horario compatible;
2. Brain interpreta el horario y su contexto;
3. WeekFlow presenta una propuesta humana y revisable;
4. ninguna modificación importante se guarda sin confirmación;
5. tras confirmar, Brain puede reorganizar la semana alrededor de esos turnos.

El objetivo no es tener un OCR perfecto aislado. El objetivo es que el usuario pueda entregar su horario y recibir una semana entendida y reorganizada con la menor carga mental posible.

## Historial

La decisión anterior, vigente desde 2026-08-18, priorizaba **foto/captura → OCR → revisión → confirmar** y mantenía Excel como capacidad secundaria. Esa estrategia queda supersedida por esta decisión y por WeekFlow Blueprint Maestro v4.0.
