# WeekFlow Alpha 0.5.25 — Brain Cloud Bridge (NO LIVE)

## Incluye
- Servidor de conversación OpenAI Responses con respuestas JSON estructuradas y autenticación Firebase verificada en Supabase.
- Puerta de salida opcional desde Asistente para preguntar libremente. Se envía solo al pulsar «Conversar con IA · enviar».
- Historia reciente efímera en la pantalla, estado mínimo y respuesta textual.
- Sugerencias tipadas de energía y Move **sin escritura directa**, con revisión y confirmación por el Brain local.
- Límites de uso persistentes preparados: 12 peticiones/cuenta/día y 120 globales/día, que requieren SQL instalado en producción.
- URL fijada al endpoint legítimo WeekFlow; secretos nunca en Android; controles de acceso y flag apagado.
- Regresiones automáticas de contrato y flujo de seguridad; política de privacidad actualizada.

## Importante
La versión **NO habilita todavía** la IA online. El Supabase WeekFlow está inactivo, no se configuró ninguna clave OpenAI y no se ejecutaron solicitudes facturables. El botón solo será visible en un APK compilado tras establecer el endpoint, la función, el presupuesto y las cuotas verificadas. «Interpretar» local se conserva íntegro.

## Próximos hitos
Restauración autorizada (tras presupuesto), SQL/rate limit, secretos, despliegue, configuración GitHub, QA real, publicación de APK con IA conectada. Guía: `docs/specs/WF-BRAIN-011-cloud-conversation.md`.
