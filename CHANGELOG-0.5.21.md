# WeekFlow Alpha 0.5.21 — Smart Import 0.8.3 Vision Bridge

- Se añadió la ruta opcional para leer una captura con un modelo visual, aislada de la lectura ML Kit local.
- El envío a IA **requiere** URL backend configurada, cuenta Firebase iniciada y consentimiento específico para cada foto; sin URL no aparece el botón y no se sube ningún horario.
- Incluye código servidor Supabase Edge que verifica firma/claims Firebase, limita imagen, usa clave de IA SOLO en servidor y solicita JSON estructurado sin guardar imágenes.
- La respuesta del modelo se valida contra nombre de empleado, siete jornadas, colación, días libres y ambigüedades antes de entrar al flujo canónico de revisión/confirmación/deshacer.
- Política de privacidad y documentación de despliegue incluidas.
- **NO LIVE**: proyecto Supabase WeekFlow figura inactivo y faltan credenciales/costos/cuotas verificadas; la 0.5.21 por defecto ejecuta únicamente OCR local. No se ha realizado una inferencia remota real.
- Sin migraciones SQLite ni cambios de firma, paquete o motores Move/Food/Rest.
- Pruebas unitarias de respuesta segura y tests de seguridad/UI para consentimientos y default offline.

Spec WF-SMART-003.
