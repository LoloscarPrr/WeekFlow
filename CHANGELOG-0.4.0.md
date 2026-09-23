# WeekFlow Alpha 0.4.0

## Food · despensa y recetas viables
- Food deja de proponer comidas sin saber qué tienes disponible.
- Nueva despensa local editable desde texto simple: por ejemplo `huevos, tomate, arroz`.
- Normalización básica evita duplicados por plurales/aliases frecuentes.
- Biblioteca ampliada a 12 recetas guiables con ingredientes canónicos, tiempo, porciones, dificultad, sustituciones y pasos.
- Las recetas se ordenan por despensa, turno, energía, tiempo preferido, presupuesto y ganas de cocinar.
- Cada tarjeta muestra `Tienes X/Y` y los ingredientes esenciales que faltan.

## Compras
- Los faltantes de una receta pueden enviarse a una lista de compras local.
- La lista evita duplicados, permite marcar comprado y quitar.
- Un ingrediente comprado solo pasa a la despensa cuando la persona toca explícitamente `+ Despensa`.

## Cocina guiada
- El modo `Cocinar conmigo` muestra qué ingredientes están disponibles y cuáles faltan.
- Se conservan sustituciones y pasos.
- Completar una receta registra la comida en el historial.

## Compatibilidad
- `Comí otra cosa`, corrección de hora y eliminación del historial se conservan.
- No se añaden calorías/macros ni diagnóstico nutricional.
- Todo sigue offline-first en SQLite local.

## Siguiente capa Food
- Reconocimiento de ingredientes desde foto/cámara alimentará esta misma despensa.
- Meal prep y reutilización semanal se montarán encima del mismo modelo.
