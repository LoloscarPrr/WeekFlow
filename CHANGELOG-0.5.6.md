# WeekFlow 0.5.6

## Onboarding progresivo — paso 1

- Una instalación realmente nueva abre una bienvenida breve antes de entrar a WeekFlow.
- El nombre es opcional y reutiliza el `UserProfile` local existente.
- Se puede ir directo a configurar Semana o entrar a Ahora y hacerlo después.
- No se exige crear cuenta.
- No se piden todavía preferencias de Move, Food, Rest, hábitos ni notificaciones.
- BottomNav queda oculto durante la bienvenida.
- Los recordatorios no se sincronizan ni solicitan permiso mientras el onboarding esté pendiente.
- Instalaciones existentes con perfil, semana, historial Move/Food o hábitos se migran silenciosamente como onboarding completado.

## Compatibilidad

- Sin migración de esquema SQLite.
- Nuevo estado `onboarding-state` usa el key/value local existente.
- No se eliminan ni reescriben semanas, perfil, historial o preferencias previas.
- Cuenta/Firebase Auth sigue siendo opcional.

Spec: `WF-ONB-001`
