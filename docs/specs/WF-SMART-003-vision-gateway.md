# WF-SMART-003 — Puente multimodal seguro y opcional

Status: LOCKED
Owner: WeekFlow
Requested: 2026-10-25
Blueprint: WeekFlow Blueprint Maestro v4.0 §15, fase 0.8.x

## Problema
Las capturas aún dependen de OCR local, sin comprensión visual de tablas complejas. No hay un endpoint de visión en producción: el proyecto Supabase «WeekFlow» existe pero está INACTIVE y no hay OPENAI_API_KEY declarada. El Android usa Firebase Auth opcional; una clave de IA jamás debe ir en el APK. Los pantallazos incluyen información de compañeros, por lo que la transferencia requiere consentimiento específico, no tácito.

## Resultado esperado
Preparar el puente extremo a extremo — cliente móvil, contrato de siete días, validación, función segura de servidor y configuración del build — para habilitar lectura visual online SOLO cuando haya servidor configurado y persona autenticada que autorice enviar su imagen. Mantener OCR local disponible, el mismo preview + confirmación + undo, y no afirmar que el proveedor está operativo hasta verificar despliegue y credenciales. Las respuestas malformadas o ambiguas no podrán modificar Semana.

## Roadmap
Phase decision: NOW. Parte de Smart Import 0.8.x, previo a optimización de OCR/pantallas.
Criterio de corte: el código puede liberarse inactivo mientras la infraestructura externa esté pendiente; no se modifica ni restaura un proyecto Supabase ni se facturan llamadas sin autorización expresa.

## Alcance
- `src/import/visionContract.ts`: normaliza respuesta multimodal a `ParsedSchedule`, valida nombre, siete días, horarios, colación, libre, conflictos, valores desconocidos y evidencia; cero inventado NO es libre. Desconocidos quedan con `issue`.
- `src/import/visionGateway.ts`: envío POST multipart cifrado HTTPS con token Firebase válido; abort timeout; nunca envía si no hay URL o sesión. No contiene clave de IA.
- `src/components/ScheduleImportCard.tsx`: acción secundaria opcional «Interpretar con IA visual», con Alert de consentimiento por imagen (incluye posibles datos de compañeros), solo para foto/captura y solo si endpoint configurado. OCR local conserva CTA principal y fallback.
- Servidor fuente `supabase/functions/vision-schedule/index.ts`: comprueba ID token de Firebase por JWKS / firma, tamaño y tipo de imagen, solicita a API multimodal desde entorno secreto, pide JSON estructurado y no almacena foto; fuente de instrucciones no confiable.
- Config del servidor y documentación de activación (proyecto Supabase inactivo, secreto y presupuesto pendientes). Se documenta que no hay servicio LIVE.
- Política de privacidad condicional clara para esta función opcional.
- Build 0.5.21, source versionCode 113, misma firma y datos.

## No objetivos
- No activar Supabase ni configurar secretos a ciegas ni desplegar un endpoint sin política de costos/abuso.
- No añadir IA remota por defecto, compartir imagen en background, subir archivos Excel/PDF, entrenar modelo, guardar fotos o crear datos paralelos.
- No sustituir confirmación humana ni automatizar replan de bloques fijos.
- No llamar al modelo si la URL está vacía o la persona no tiene cuenta iniciada.
- No exponer claves del servidor en repo/Expo/variables públicas.

## Criterios de aceptación
1. Sin endpoint y sin cuenta la lectura por ML Kit continúa igual; ninguna foto sale del móvil.
2. Con endpoint y cuenta hay un botón separado que solicita consentimiento informado por cada imagen antes de realizar POST; cancelar no envía nada.
3. La conexión usa Firebase ID token, multipart seguro HTTPS, timeout y errores controlados; sin OPENAI_API_KEY cliente.
4. El backend valida Firebase ID token, tipo/bytes imagen y estructura; no permite acceso anónimo, no persiste imagen, evita logging de datos.
5. La salida del modelo se normaliza a 7 `ReviewShift` y solo reconoce nombre real/único. Días incompletos, colación desconocida, libre contradictorio o horas ilógicas son marcados para corrección.
6. `confirmReviewedImport` y `undoReviewedImport` son la única vía de persistencia; no hay segunda semana ni bypass.
7. Tests puros y estructurales: casos positivos/ambiguos, no cuenta, sin endpoint, fallo red, protección offline, privacidad, regresiones OCR/Excel/PDF.
8. Quality CI + APK/AAB firmada. Piloto IA remota solo puede marcarse LIVE tras activar Supabase, provisionar OPENAI_API_KEY, controles de presupuesto y una prueba remota verificada con consentimiento. QA Android por lote, no cada microversión.

## Seguridad / privacidad
- Captura laboral puede contener datos de terceras personas; explicitar destino de procesamiento OpenAI al optar, requisito de inicio de sesión y destino de servidor, sólo imagen seleccionada.
- Los secretos `OPENAI_API_KEY` y configuración `FIREBASE_PROJECT_ID` viven exclusivamente en Edge Secrets. Supabase `verify_jwt=false` solo porque Firebase JWT no es Supabase JWT; el código VERIFICA manualmente firma, aud/iss y expiración antes de inferencia.
- Se exige HTTPS, límite de bytes, token de sesión, salida JSON estricta, `store:false` para la API modelo. Control de costos/rate limiting persistente pendiente antes de activar en producción.
- No escribir token/imagen/matrícula de personal en logs.
- Si backend no está configurado, no existe botón de envío; informar solo OCR local.

## Verificación
Pending.
