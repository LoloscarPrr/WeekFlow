# WeekFlow Alpha 0.5.24 — Brain: energía + Move en una solicitud

## Funcionalidad
- «Hoy estoy cansado y quiero entrenar espalda y bíceps» interpreta dos elementos: energía **actual** y grupos musculares de Move.
- Muestra energía, músculos e intensidad estimada antes de confirmar. Ninguna escritura ocurre sin confirmar.
- Una confirmación aplica la energía y las preferencias Move mediante una **transacción SQLite** sobre los datos canónicos; un solo Deshacer revierte ambos.
- Antes de confirmar o deshacer se comprueba si hubo cambios de estado o hay sesión guiada activa.
- Las propuestas caducan si cambia el día.
- Se incorporan «brazos»/«antebrazos» como selección de bíceps+tríceps.

## Seguridad / límites
- Fecha futura, cambio de turno, duración numérica en texto, negaciones y situaciones hipotéticas se rechazan sin aplicar solo una parte.
- Sigue siendo un intérprete local **acotado**, no un LLM ni una replanificación automática de sueño, alimentación y jornadas.
- Duraciones disponibles en Move: 30, 45 o 60 minutos.
- Se conserva la base SQLite existente y el paquete Android `com.weekflow.app`.

## Verificación
- GitHub Quality debe pasar en el PR y en main.
- Build Android firmado y prueba real en dispositivo requeridos para cierre de entrega física.
