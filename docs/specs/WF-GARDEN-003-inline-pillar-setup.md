# WF-GARDEN-003 — Configuración inline de pilares del Jardín

## Objetivo
Permitir configurar por primera vez los pilares que hoy no tienen fuente real directamente desde su tarjeta en Jardín. Después de guardar, la tarjeta debe volver a modo resumen y la edición posterior debe moverse a Herramientas.

## Alcance
Aplica a Relaciones, Bienestar, Hogar, Responsabilidades y Tiempo personal. Move, Food y Rest no cambian.

## Comportamiento
- Un pilar sin configuración muestra `Sin datos` y una acción `Configurar`.
- Al tocar `Configurar`, la misma tarjeta expande un selector simple de días de la semana.
- Guardar requiere al menos un día.
- Tras guardar, el formulario desaparece de la tarjeta.
- La tarjeta muestra los días elegidos como evidencia, por ejemplo `Mar · Sáb`, y estado neutral `Planificado`.
- La configuración no cuenta como cumplimiento ni como equilibrio; solo representa una intención semanal.
- Los pilares ya configurados aparecen abajo en Herramientas dentro de `Editar pilares`.
- La edición posterior se realiza desde Herramientas; guardar vuelve a cerrar el editor.
- La configuración persiste localmente en SQLite mediante un estado nuevo y aditivo, sin migración destructiva.

## No objetivos
- No registrar cumplimiento todavía.
- No calcular puntajes, rachas ni porcentajes.
- No usar Brain/IA para elegir días.
- No cambiar hábitos, Move, Food, Rest ni Semana.

## Aceptación
1. Configurar Relaciones con martes y sábado guarda y la tarjeta muestra `Mar · Sáb`.
2. La tarjeta deja de mostrar `Configurar` después de guardar.
3. Herramientas permite volver a editar un pilar configurado.
4. Un pilar no configurado sigue mostrando `Sin datos`.
5. Reiniciar la app conserva los días configurados.
6. No se atribuye progreso por el solo hecho de configurar.

Spec: WF-GARDEN-003
