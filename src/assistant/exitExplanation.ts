import type { ExitReplanImpact } from '../brain/exitImpact';

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

// Single explanatory voice; all facts arrive from the same Brain/Now assessment.
export function describeExitImpact(
  exit: string,
  impact: ExitReplanImpact,
  confirmed: boolean,
): string {
  const difference = impact.deltaMinutes === 0
    ? 'según lo programado'
    : `${duration(Math.abs(impact.deltaMinutes))} ${impact.deltaMinutes > 0 ? 'después' : 'antes'} de lo programado`;

  const facts = `Salida ${exit} (${difference}). Llegada estimada ${impact.homeAt}; recuperación desde ${impact.recoveryAt}.`;

  if (impact.requiresConfirmation) {
    const blockLabel = `${impact.flexibleCount} ${impact.flexibleCount === 1 ? 'bloque flexible' : 'bloques flexibles'}`;
    return `${facts} ${confirmed ? 'Falta revisar' : 'Revisarás'} ${blockLabel} en Ahora antes de moverlos. Los compromisos fijos se mantienen.`;
  }

  if (impact.affectsRest) {
    return `${facts} Rest se protege; los compromisos fijos no cambian.`;
  }

  if (!impact.flexibleCount) {
    return `${facts} Sin bloques flexibles que reajustar. Los compromisos fijos se mantienen.`;
  }
  return `${facts} ${confirmed ? 'Solo se reajustó' : 'Solo se reajustará'} lo flexible. Los compromisos fijos se mantienen.`;
}
