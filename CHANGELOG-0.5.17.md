# WeekFlow Alpha v0.5.17

## Brain 0.7.8 — registrar comida desde Asistente
- «Comí pan tostado con margarina», «Desayuné avena» o «Almorcé arroz con pollo» generan una propuesta para registrar exactamente ese alimento en Food.
- El usuario confirma antes de registrar; no se inventan cantidades, calorías ni macronutrientes.
- Se reutiliza el registro manual canónico de Food y la vista Food se actualiza al enfocarla.
- «Deshacer cambio» elimina exclusivamente esa entrada, protegiendo cambios realizados después desde Food.
- Las preguntas «¿Qué comí hoy?» siguen siendo de solo lectura; frases negativas, otras fechas e imprecisas se rechazan.
- Sin migraciones ni cambios en otras pantallas: mismo paquete, firma y almacenamiento local.

## Verificación
- Nuevas pruebas de parser y Brain Food: confirmación, no duplicación, cruce de fecha y conflictos de undo.
- Quality CI y Android Release firmada se verificarán antes de entregar APK.

Spec: WF-BRAIN-008.
