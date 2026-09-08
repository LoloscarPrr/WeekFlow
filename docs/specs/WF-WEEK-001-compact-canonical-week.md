# WF-WEEK-001 — Semana canónica y compacta

Status: LOCKED
Owner: WeekFlow

## Problem
La pantalla Semana mezcla el editor canónico de jornadas con un bloque largo de ritual, origen, resumen narrativo, momentos importantes y una segunda confirmación. El resultado repite información, obliga a desplazarse demasiado y contradice la decisión de 0.2.5 que dejó la captura manual de compromisos para el futuro Asistente.

## Desired behavior
Semana debe mostrar únicamente la información y acciones útiles hoy: un encabezado compacto, el resumen de carga, los siete días editables y el acceso para importar o reemplazar el horario. La edición debe seguir guardándose de inmediato y los datos históricos de momentos importantes deben conservarse internamente.

## Scope
- Compactar el encabezado de Semana y evitar la repetición `SEMANA` / `Tu semana.`.
- Conservar un resumen semanal breve con jornadas, días libres y horas programadas.
- Conservar las siete filas editables y todos sus controles actuales.
- Simplificar el acceso a importación a una sola acción clara.
- Dejar de renderizar y eliminar la UI manual de `WeekRitualCard`.
- Retirar del controlador de Semana los callbacks que solo alimentaban esa UI.
- Corregir el texto posterior a una importación para que no solicite un ritual o una segunda confirmación inexistentes.
- Publicar el cambio como `0.3.15` con notas de versión.

## Non-goals
- No cambiar OCR, cámara, galería, Excel, PDF ni su lógica de revisión.
- No borrar ni migrar `importantMoments`, `organizedAt` ni sus casos de uso de dominio.
- No mover compromisos personales a otra pantalla en esta versión.
- No rediseñar Ahora, Pilares, Jardín, Asistente, Move, Food ni Rest.
- No cambiar la navegación inferior ni el esquema SQLite.

## Acceptance criteria
- [ ] AC1 — Semana muestra un único título compacto, sin el eyebrow `SEMANA` ni la frase duplicada `Tu semana.`.
- [ ] AC2 — El resumen sigue mostrando jornadas, libres y tiempo programado, con menor altura y sin explicación narrativa adicional.
- [ ] AC3 — Las siete filas siguen siendo tocables y cada editor conserva Trabajo/Libre, Entrada, Salida y Colación.
- [ ] AC4 — Existe una acción tocable `Importar horario` que abre `/import`, sin subtítulo redundante.
- [ ] AC5 — Semana no renderiza Ritual, Origen, Resumen humano, formulario/lista de momentos importantes ni confirmación final.
- [ ] AC6 — Los mensajes posteriores a importar no indican terminar un ritual ni confirmar por segunda vez; explican que el horario quedó guardado y puede corregirse en Semana.
- [ ] AC7 — Los modelos, datos persistidos y consumidores existentes de `importantMoments`/`organizedAt` se mantienen sin migración ni pérdida.
- [ ] AC8 — Quality completo pasa; versión y changelog quedan en `0.3.15`; el build Android de `main` pasa antes de cerrar la spec.

## Data / persistence impact
Ningún cambio de esquema ni migración. Se conserva la lectura/escritura existente de jornadas y la compatibilidad de `importantMoments` y `organizedAt`. La pantalla simplemente deja de exponer sus controles manuales.

## UI / UX impact
- Menos altura inicial y menos desplazamiento.
- Solo permanecen elementos informativos esenciales o acciones reales.
- El editor expandido, el selector horario nativo, el teclado numérico y el padding inferior se preservan.
- La acción de importar mantiene un área táctil mínima de 48 dp.

## Edge cases / regressions
- Semana con siete días libres o siete jornadas mantiene un resumen legible.
- Jornadas nocturnas siguen mostrando el rango cruzando medianoche.
- Colación 0 permanece oculta en la fila; una colación real sigue visible.
- Abrir/cerrar días repetidamente no altera datos.
- La barra inferior no tapa el último control.
- Importar y volver a Semana no requiere otra confirmación.
- Ahora y notificaciones siguen leyendo momentos históricos existentes.
- Sibling screens checked: importación, Ahora y notificaciones; sin cambios visuales fuera de Semana/import copy.

## Verification plan
- [ ] Revisar el árbol renderizado y estilos de `app/week.tsx` contra AC1–AC5.
- [ ] Buscar referencias residuales a `WeekRitualCard` y copy de ritual.
- [ ] Ejecutar `npm run quality`.
- [ ] Revisar diff y confirmar que no hay cambios de persistencia/migración.
- [ ] Abrir PR con `Spec: WF-WEEK-001` y checklist PASS/BLOCKED.
- [ ] Fusionar tras Quality y comprobar Quality + Android en `main`.

## Implementation notes
La eliminación se limita a la capa de presentación. Los casos de uso de ImportantMoment se conservan porque Ahora y notificaciones aún consumen datos existentes y el futuro Asistente reutilizará el mismo estado canónico.

## Verification result
- AC1: PENDING
- AC2: PENDING
- AC3: PENDING
- AC4: PENDING
- AC5: PENDING
- AC6: PENDING
- AC7: PENDING
- AC8: PENDING
