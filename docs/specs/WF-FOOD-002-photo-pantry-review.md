# WF-FOOD-002 — Foto de despensa revisable

Status: DONE
Owner: WeekFlow
Approved by: Oscar · 24-09-2026
Blueprint mapping: 0.4.x · Food completo · entrada por foto

## Problem
Food ya acepta texto para “¿Qué tienes disponible?”, pero el roadmap exige también foto. La app debe poder proponer ingredientes desde una imagen sin crear una segunda despensa ni guardar detecciones incorrectas en silencio.

## Desired behavior
- La persona puede tomar una foto o elegir una imagen desde galería desde Food.
- WeekFlow procesa la imagen localmente con el ML Kit OCR ya instalado.
- Se extraen candidatos solo cuando el texto visible coincide con ingredientes canónicos conocidos por Food.
- Los candidatos aparecen en una pantalla de revisión antes de guardar.
- El usuario puede activar/desactivar candidatos y escribir ingredientes que la foto no detectó.
- Confirmar fusiona los ingredientes revisados con el FoodPantry existente, sin duplicados.
- Cancelar o un fallo de reconocimiento no modifica la despensa.
- La foto no se persiste ni se sube por este flujo.
- Si no se reconoce texto útil, la UI explica que la detección necesita nombres/etiquetas visibles y permite completar manualmente.

## Scope
- Cámara y galería con expo-image-picker existente.
- OCR local con @infinitered/react-native-mlkit-text-recognition existente.
- Parser puro de texto OCR → candidatos canónicos Food.
- Revisión explícita de candidatos.
- Campo manual dentro de la revisión.
- Fusión con FoodPantry.
- Ajuste de copy de permisos cámara/fotos para incluir ingredientes además de horarios.
- Actualización de privacidad para explicar procesamiento local de fotos Food.

## Non-goals
- Clasificación visual general de frutas/verduras sin texto.
- Modelos cloud o subida de fotos.
- Reconocimiento perfecto de marcas/productos.
- Guardado automático de ingredientes por confianza.
- Calorías, macros o diagnóstico alimentario.

## Data / persistence impact
- Reutiliza food-pantry.
- No persiste URI ni bytes de foto.
- No crea nueva tabla ni nueva verdad de despensa.

## Edge cases
- Foto cancelada: no cambia nada.
- Permiso cámara denegado: se informa y se mantiene galería/texto disponibles.
- OCR falla: no cambia nada.
- OCR sin coincidencias: revisión queda vacía y permite entrada manual.
- Duplicados foto + despensa se fusionan una sola vez.
- Duplicados entre candidatos y texto manual se fusionan.
- Un token desconocido nunca se agrega automáticamente.

## Acceptance criteria
- [x] AC1 — Cámara y galería están disponibles desde Food.
- [x] AC2 — OCR se ejecuta localmente sobre la URI elegida.
- [x] AC3 — Parser reconoce aliases canónicos conocidos, por ejemplo “HUEVOS”, “ARROZ”, “ATÚN”.
- [x] AC4 — Texto desconocido no se convierte en ingrediente automático.
- [x] AC5 — Los candidatos se revisan antes de guardar.
- [x] AC6 — El usuario puede desmarcar candidatos.
- [x] AC7 — El usuario puede añadir manualmente ingredientes omitidos dentro de la revisión.
- [x] AC8 — Confirmar fusiona con FoodPantry sin duplicados.
- [x] AC9 — Cancelar/fallo no modifica FoodPantry.
- [x] AC10 — La foto/URI no se persiste por este flujo.
- [x] AC11 — Los permisos dejan de hablar solo de “horario” y cubren ingredientes.
- [x] AC12 — Copy de privacidad indica procesamiento local y revisión explícita.
- [x] AC13 — TypeScript + regresiones pasan.
- [x] AC14 — Android release 0.4.1 compila con la firma permanente.

## Verification plan
- Tests puros de OCR text → candidatos.
- Tests de aliases, unknowns y merge.
- Revisión estructural de camera/gallery + explicit confirm.
- Typecheck y suite de regresiones.
- PR Quality y Android release.
- Calidad real de reconocimiento: validación física posterior con fotos reales.

## Verification result

- Functional acceptance: PASS — merged in `437756025c972be7d51d2fe100c8acafb771cd77`.
- PR Quality #183: PASS.
- Main Quality #184: PASS.
- Android #150: PASS — signed WeekFlow 0.4.1 APK + AAB generated and published.
- Physical-device camera recognition quality and Prep ergonomics remain manual field-validation items; CI cannot validate real-world camera accuracy.
