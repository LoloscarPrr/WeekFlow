/** All vertical coordinates are measured in the same native window. */
export function keyboardOverlapSpacer(input: {
  viewportTop: number; viewportHeight: number; keyboardTop: number; gap?: number;
}): number {
  const { viewportTop, viewportHeight, keyboardTop, gap = 12 } = input;
  if (![viewportTop, viewportHeight, keyboardTop, gap].every(Number.isFinite) || viewportHeight <= 0) return 0;
  const overlap = viewportTop + viewportHeight - keyboardTop;
  if (overlap <= 0) return 0;
  return overlap + Math.max(0, gap);
}

export function keyboardVisibleOffset(input: {
  fieldTop: number; fieldHeight: number; viewportTop: number; viewportHeight: number;
  keyboardTop: number; offset: number; contentHeight: number; gap?: number;
}): number {
  const { fieldTop, fieldHeight, viewportTop, viewportHeight, keyboardTop, offset, contentHeight, gap = 12 } = input;
  if (![fieldTop, fieldHeight, viewportTop, viewportHeight, keyboardTop, offset, contentHeight, gap].every(Number.isFinite)
      || fieldHeight <= 0 || viewportHeight <= 0) return offset;
  const top = viewportTop + gap;
  const bottom = Math.min(viewportTop + viewportHeight, keyboardTop) - gap;
  if (bottom <= top) return offset;
  // Oversized multiline inputs align their top rather than oscillating between edges.
  const delta = fieldHeight > bottom - top ? fieldTop - top
    : fieldTop < top ? fieldTop - top : Math.max(0, fieldTop + fieldHeight - bottom);
  if (Math.abs(delta) < 1) return offset;
  return Math.max(0, Math.min(Math.max(0, contentHeight - viewportHeight), offset + delta));
}
