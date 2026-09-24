# WeekFlow Alpha 0.4.1

## Food · foto revisable
- “¿Qué tienes disponible?” ahora acepta cámara y galería además de texto.
- La imagen se procesa localmente con el ML Kit OCR ya integrado.
- Food propone únicamente ingredientes canónicos cuando reconoce nombres o etiquetas visibles.
- Antes de guardar aparece una revisión: puedes quitar candidatos y escribir lo que la foto no detectó.
- Cancelar o un fallo de reconocimiento no modifica la despensa.
- La foto no se guarda como parte de la despensa ni se sube por este flujo.
- Los permisos y la política de privacidad se actualizaron para cubrir el uso de cámara/galería en Food.

## Food · Prep
- Nueva pantalla Prep con porciones preparadas persistentes.
- Puedes preparar 2 o 4 porciones guiadas y guardarlas sin marcar que las comiste.
- “Comí una porción” registra la comida y descuenta una porción.
- La última porción consumida elimina automáticamente esa preparación.
- Puedes quitar una preparación sin registrar consumo.
- Food muestra cuántas porciones tienes listas desde la pantalla principal.

## Reutilización de ingredientes
- Food busca pares de recetas que compartan ingredientes esenciales.
- La UI muestra exactamente qué ingredientes se reutilizan.
- El ranking favorece más ingredientes compartidos y menos faltantes.
- No se inventan caducidades ni garantías de seguridad alimentaria.

## Compatibilidad
- Despensa, compras, recetas viables, “Comí otra cosa”, corrección de hora y cocina guiada existente se conservan.
- Todo sigue offline-first.
- No se añaden calorías/macros ni dependencia cloud para Food.
