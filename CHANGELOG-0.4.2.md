# WeekFlow Alpha 0.4.2

## Teclado y focus
- Los campos de texto ya no usan el focus para mandar la pantalla al final.
- Food mantiene el campo enfocado mientras escribes sin saltar al fondo.
- Evento importante / recordatorios mantiene el focus sin desplazar Semana al final.
- Corregir hora ya no fuerza el scroll al enfocar hora o minutos.
- El comentario opcional de Move ya no manda la vista al final al enfocarlo.
- Guardar, Cancelar o cerrar explícitamente un modal pueden seguir cerrando el teclado.
- Arrastrar una pantalla puede seguir cerrando el teclado donde ya existía keyboardDismissMode="on-drag".

## Prevención
- Nueva regresión global recorre todos los TSX con TextInput y falla si una vista vuelve a introducir scrollToEnd() como parte de ese formulario.

## Sin cambios de lógica
- No cambia Food, Move, recordatorios, horarios, cuentas ni persistencia.
