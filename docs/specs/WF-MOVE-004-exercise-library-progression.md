# WF-MOVE-004 — Biblioteca de ejercicios y progresión por feedback

Status: LOCKED
Owner: WeekFlow
Approved by: Oscar · 19-09-2026
Source: prueba física de WeekFlow Alpha 0.3.22 + feedback del usuario
Blueprint mapping: MOV-08, MOV-09, progresión adaptativa Move

## Problem

Move ya adapta duración, densidad e intensidad con energía, experiencia, feedback y equipo, pero su catálogo es pequeño y el feedback final no cambia de forma explícita la dificultad concreta de los ejercicios.

La prueba física muestra que una sesión puede usar una variante cargada y luego registrar "Muy fácil / Bien / Difícil / Demasiado", pero la siguiente rutina no conserva qué ejercicios se realizaron ni usa ese dato para avanzar/regresar dentro de una familia de movimiento.

## Desired behavior

- Move tiene una biblioteca amplia y visible de ejercicios organizada por patrón, dificultad y equipo.
- Cada ejercicio conoce su familia de progresión, dificultad 1–5, equipo, posición, impacto, zonas implicadas y requisitos de experiencia/intensidad.
- La biblioteca es inclusiva: no asigna ni bloquea ejercicios por género ni por somatotipo. La selección usa capacidades y contexto reales: experiencia, energía, restricciones, impacto, rango disponible, equipo, carga y feedback.
- Al terminar una sesión se guardan los IDs de ejercicios efectivamente realizados.
- En la próxima sesión:
  - "Muy fácil" intenta subir una variante dentro de la misma familia;
  - "Bien" conserva aproximadamente el nivel;
  - "Difícil" baja una variante;
  - "Demasiado" baja más y conserva la reducción de intensidad/duración ya existente;
  - terminar antes sin feedback se trata de forma conservadora.
- La progresión nunca introduce equipo ausente, impacto bloqueado, suelo/silla no disponibles ni zonas evitadas.
- El usuario puede abrir una pantalla "Biblioteca Move" para explorar ejercicios y entender qué equipo/dificultad requieren.

## Scope

- Crear catálogo Move separado de la lógica de generación.
- Expandir inventario de equipo:
  - mancuernas (kg c/u);
  - kettlebell (kg);
  - banda de resistencia;
  - barra/barbell (kg cargados);
  - banco;
  - barra de dominadas;
  - polea/cable;
  - máquinas de gimnasio;
  - TRX/suspensión;
  - balón medicinal (kg);
  - cuerda para saltar;
  - step/cajón;
  - foam roller;
  - chaleco lastrado (kg).
- Añadir preferencia "bajo impacto".
- Sembrar biblioteca amplia con variantes de:
  - sentadilla;
  - bisagra/cadera;
  - zancada;
  - empuje horizontal/vertical;
  - tirón horizontal/vertical;
  - core;
  - locomoción/condición;
  - movilidad/recuperación.
- Añadir metadatos de progresión y dificultad.
- Persistir ejercicios realizados en MoveSessionRecord.
- Pasar contexto de la sesión anterior al generador.
- Añadir pantalla navegable de biblioteca con filtros simples por patrón/equipo/dificultad.
- Mantener compatibilidad con historial y preferencias legacy.
- Regresiones de progresión y equipo.
- Bump a 0.3.23 y build Android firmado.

## Non-goals

- No prescribir rehabilitación, tratamiento de lesiones ni ejercicios clínicos.
- No clasificar cuerpos como ectomorfo/mesomorfo/endomorfo ni por BMI.
- No seleccionar ejercicios por género/sexo.
- No calcular 1RM ni subir automáticamente los kg declarados.
- No asumir que "Muy fácil" autoriza más peso; primero cambia la variante/dificultad o densidad dentro de límites compatibles.
- No sustituir consejo profesional ante dolor/lesión.
- No convertir todavía Move en un programa semanal de hipertrofia periodizado.

## Acceptance criteria

- [ ] AC1 — Existe un catálogo exportado con al menos 40 ejercicios y metadatos de patrón/familia/dificultad/equipo.
- [ ] AC2 — El catálogo incluye bodyweight, silla/suelo y todas las categorías de equipo definidas en Scope.
- [ ] AC3 — Ningún ejercicio tiene restricción por género; la UI explica que Move adapta por capacidad/contexto y no por género/somatotipo.
- [ ] AC4 — Preferencias legacy con solo mancuernas/kettlebell/banda migran sin pérdida.
- [ ] AC5 — Perfil Move permite registrar el equipo nuevo y activar bajo impacto.
- [ ] AC6 — Sesiones nuevas persisten los IDs de ejercicios efectivamente realizados; historial legacy sin IDs sigue funcionando.
- [ ] AC7 — "Muy fácil" hace que la siguiente rutina intente una dificultad mayor dentro de familias previamente realizadas cuando existe una variante compatible.
- [ ] AC8 — "Difícil" y "Demasiado" regresan dificultad; "Demasiado" conserva además la reducción de intensidad/duración existente.
- [ ] AC9 — "Bien" no fuerza progresión ni regresión.
- [ ] AC10 — Progresión/regresión respeta equipo, experiencia, intensidad, bajo impacto, silla/suelo y zonas evitadas.
- [ ] AC11 — Recuperación no introduce cargas externas exigentes ni variantes de alto impacto.
- [ ] AC12 — Existe pantalla "Biblioteca Move" accesible desde el plan, con búsqueda/filtros compactos y detalle de dificultad/equipo.
- [ ] AC13 — Preview, player y "Cambiar ejercicio" siguen usando la misma compatibilidad del catálogo.
- [ ] AC14 — Quality/TypeScript/regresiones pasan.
- [ ] AC15 — Android release 0.3.23 genera APK + AAB firmados.

## Data / persistence impact

- MovePreferences amplía `equipment` y suma `lowImpactOnly`; sanitización mantiene defaults seguros para datos legacy.
- MoveSessionRecord suma `exerciseIds?: string[]`.
- No hay cambio de esquema SQLite: ambos continúan persistidos como JSON.

## Safety / inclusivity

- La biblioteca no infiere aptitud, género, condición médica o "tipo de cuerpo".
- Peso/altura siguen siendo contexto opcional, no clasificación.
- Dolor o una zona marcada para evitar siempre gana sobre progresión.
- Cargas externas se usan solo si fueron declaradas por el usuario.
- "Muy fácil" no incrementa los kg registrados automáticamente.

## Verification result

- AC1–AC15: PENDING
