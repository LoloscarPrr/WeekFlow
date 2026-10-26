# WF-BRAIN-011 — Brain conversacional con OpenAI vía Supabase (PREPARADO, NO LIVE)

## Objetivo
Dejar de depender exclusivamente de frases rígidas. Activar, cuando infraestructura y cuotas estén aprobadas, conversación real con un modelo de OpenAI, usando contexto *mínimo* de WeekFlow. La respuesta no muta datos. Toda acción potencial vuelve a pasar por el parser, Brain Action Foundation y confirmación local.

## Lo implementado
- `supabase/functions/brain-chat/index.ts`: autenticación Firebase ID token RS256 (audience, issuer, email_verified), flag server-side apagado por defecto, llamada a OpenAI Responses API con `store:false` y schema estricto.
- `src/assistant/cloudGateway.ts`: opción nube tras toque explícito, token efímero, URL HTTPS fija del Supabase WeekFlow, timeout, errores que mantienen `Interpretar` local.
- `cloudContract.ts`: sugerencias limitadas a `energy`, `move`, `energy_move` o `none`. Se valida la respuesta y se convierte a un comando local. **No existe autorización de escritura desde la IA**.
- UI: botón opcional (no visible sin configuración), aviso de datos transmitidos, conversación efímera con últimas 6 intervenciones y botón separado de revisión si existe propuesta.
- `supabase/sql/brain-chat-quota.sql`: cupos duraderos y atómicos: **12 por cuenta por día UTC** y **120 globales por día UTC**, sin habilitar acceso público a datos. Las consultas denegadas no llaman a OpenAI.
- Política de privacidad ampliada. Quality CI incluye contrato y seguridad estructural.

## Estado de infraestructura
El proyecto Supabase `fkgccemweaqkdrjozgml` (organización LifeFlow, plan **Free**) fue restaurado y llegó a **ACTIVE_HEALTHY**. La función `brain-chat` está desplegada en versión 1 (ACTIVE), pero OpenAI sigue apagado por falta de habilitación explícita/clave. Tras estabilizar el proyecto se aplicó de nuevo la migración `brain_chat_daily_quota_v1` y se verificó: RLS habilitado, anon/authenticated sin SELECT ni EXECUTE y service_role autorizado. Pruebas transaccionales reversibles: 12 solicitudes por cuenta aceptadas + 13ª rechazada; 120 globales aceptadas + 121ª rechazada. No se introdujo `OPENAI_API_KEY` ni hubo llamadas facturables. El APK no incluye secretos.

## Activación con autorización y presupuesto
1. Confirmar presupuesto/cuotas de OpenAI API y límites de la organización Supabase Free con quien pague el servicio. Supabase aceptó la restauración en Free, sin contratar Pro. Un límite diario de solicitudes **no sustituye** un límite de gasto monetario.
2. Comprobar que el proyecto restaurado llegue a estado ACTIVE y revisar facturación y alarmas de gasto de ambos proveedores.
3. Revisar/verificar la migración `brain_chat_daily_quota_v1` aplicada desde `supabase/sql/brain-chat-quota.sql` en la base con rol administrador. Verificar RLS, `revoke` para `anon`/`authenticated`, permisos `service_role` y que RPC retorna `true` hasta el límite y `false` al superarlo.
4. Configurar secretos **solo en Edge Function**: `OPENAI_API_KEY`, `FIREBASE_PROJECT_ID=weekflow-84a82`, `WEEKFLOW_BRAIN_QUOTA_SALT` aleatorio largo. `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son variables del entorno administrado, confirmarlas antes. Mantener `ENABLE_WEEKFLOW_BRAIN=false`.
5. Desplegar `brain-chat` con `verify_jwt=false` deliberadamente: Firebase JWT no es JWT Supabase; el handler verifica Firebase y correo confirmado. Probar 401, 413, 429 y 503; revisar cabeceras, latencia, fallos del proveedor, y llamadas reales a OpenAI con una cuenta de prueba verificada.
6. Solo al validar los límites y el costo, activar `ENABLE_WEEKFLOW_BRAIN=true` en Supabase y GitHub repo variable pública `WEEKFLOW_BRAIN_URL=https://fkgccemweaqkdrjozgml.supabase.co/functions/v1/brain-chat`. Se necesita nuevo APK compilado con esa variable (el build anterior está apagado).
7. QA física: preguntar por Move, energía, trabajo y descanso; revisar que preguntas no muten datos, que el modelo no invente horarios, que sugerencias exijan doble toque (Revisar + Confirmar), y que deshacer funcione. Validar la política de privacidad en el teléfono.

## Límites deliberados
- Historia en memoria, no transcripciones persistidas; al cerrar pantalla se pierde el contexto conversacional.
- Solo cuatro categorías de sugerencia para acciones; no se modifica Semana, Food, Rest ni notificaciones mediante sugerencias cloud. Las preguntas pueden conversar sobre el resumen disponible pero **no pueden leer** una semana completa ni datos no enviados.
- Quedan pendientes consentimiento operativo y pruebas con proveedor real. Enfoque de IA desactivado por defecto, por tanto no anunciar como LIVE.
- Las recomendaciones del modelo son orientativas y pueden equivocarse; la fuente de verdad sigue siendo la app local.
