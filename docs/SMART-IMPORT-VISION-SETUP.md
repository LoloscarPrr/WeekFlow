# Smart Import 0.8.3 — Configurar visión multimodal (NOT LIVE)

El puente de visión permite analizar optativamente una captura mediante una función remota autenticada. En la versión 0.5.21 el modo local ML Kit OCR continúa siendo el único modo habilitado por defecto.

## Estado real al preparar este avance

- Supabase proyecto **WeekFlow** `fkgccemweaqkdrjozgml`: **INACTIVE** al 25-10-2026. No se restauró ni desplegó el endpoint.
- No se encontró una clave activa `OPENAI_API_KEY` verificable y no se introdujo ningún secreto en la aplicación.
- No hay tests de llamadas reales al proveedor, cuotas en producción ni consentimiento en teléfono: **NO anunciar IA visual LIVE**.

## Activación futura con autorización de la persona propietaria

1. Restaurar el proyecto Supabase existente y comprobar presupuesto/cuotas y protecciones antiabuso antes de exponer un servicio con costo por inferencia.
2. Aprovisionar exclusivamente en **Edge Function Secrets**: `OPENAI_API_KEY`, `FIREBASE_PROJECT_ID=weekflow-84a82`, `ENABLE_WEEKFLOW_VISION=true` y opcional `OPENAI_VISION_MODEL`. Nunca usar `EXPO_PUBLIC_` para API keys.
3. Desplegar `supabase/functions/vision-schedule/index.ts` con `supabase/config.toml`. `verify_jwt=false` no deja abierta la función: el handler rechaza peticiones sin Firebase ID token de firma válida/usuario con correo verificado.
4. Definir un límite persistente de requests por UID, presupuesto máximo y alertas de gasto; los controles de identidad en el código NO sustituyen cuotas ni defensa contra abuso. Mantener `ENABLE_WEEKFLOW_VISION=false` hasta verificarlo.
5. En GitHub Repo Variables, fijar **`WEEKFLOW_VISION_URL`** a la URL HTTPS verificada de la Edge Function; el workflow Android inyecta el valor público como `EXPO_PUBLIC_WEEKFLOW_VISION_URL` sin incluir secretos.
6. QA remoto usando una imagen de prueba consentida, confirmar estructura de siete días y bloqueos de ambigüedad, latencia, cuotas y respuestas no confiables. Solo entonces declarar el servicio activo.

## Flujo móvil

- Sin URL configurada, solo funciona la lectura **local**: no hay red ni cambios de privacidad.
- Con URL y Cuenta WeekFlow iniciada, aparece **«Interpretar con IA visual»** en una imagen; al tocarlo se informa que la foto laboral puede contener datos de compañeros y se pide **consentimiento para esa foto**.
- El móvil envía solo la foto elegida y el nombre de la fila a una función propia vía HTTPS, con Firebase ID token temporal.
- El servidor verifica identidad, tamaño/MIME y consulta un modelo visual con clave **solo en servidor**; usa `store:false`.
- La respuesta vuelve al contrato `ParsedSchedule` y requiere revisar/confirmar la semana mediante el mismo Brain; el modelo no puede guardar el horario automáticamente.
- Fallas de la red nunca cambian Semana y dejan OCR local disponible.

## Privacidad y protección

El servidor no escribe fotos en almacenamiento ni las agrega a logs; no garantiza ausencia absoluta de retención en la infraestructura de proveedores. Esta función opcional envía la imagen a Supabase y al proveedor de IA, bajo sus políticas respectivas. **No usar con imágenes confidenciales o de terceros sin autorización**. No se realizará inferencia en segundo plano ni se transmitirá una foto por elegirla.

## Calidad

Pruebas del contrato, validación y guardas de red offline; CI de TypeScript/regresiones Android. Prueba remota y privacidad en teléfono pendientes de infraestructura real.
