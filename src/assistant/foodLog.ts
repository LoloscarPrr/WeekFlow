// Interpreta únicamente declaraciones inequívocas de comida ya consumida.
// No infiere cantidades, calorías ni ingredientes que no estén en el mensaje.
export function parseConsumedFood(input: string): string | null {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text || /[¿?]/.test(text)) return null;
  if (/\b(?:ayer|anteayer|mañana|pasado mañana|anoche)\b/i.test(text)) return null;
  if (/\b(?:no|nunca|tampoco)\s+(?:com[ií]|desayun[eé]|almorc[eé]|cen[eé])\b/i.test(text)) return null;

  const match = /^(?:(?:hoy)\s+)?(?:(?:yo)\s+)?(?:com[ií]|desayun[eé]|almorc[eé]|cen[eé])\s+(.+?)[.!]*$/i.exec(text);
  if (!match) return null;

  const title = match[1].trim();
  if (!title || title.length > 120 || !/[a-záéíóúüñ]/i.test(title)) return null;
  if (/^(?:nada|algo|lo mismo|cualquier cosa|no s[eé]|ninguna cosa)$/i.test(title)) return null;
  if (/(?:^|\s)y\s+(?:com[ií]|desayun[eé]|almorc[eé]|cen[eé]|sal[ií]|entro|salgo|estoy)(?=\s|$|[.,;!?])/i.test(title) || /\bpero\s+no\b/i.test(title)) return null;
  return title;
}
