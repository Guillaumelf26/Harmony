/**
 * Trouve l'accord [xxx] contenant ou adjacent à la position pos.
 */
export function getChordAtCursor(
  pos: number,
  doc: string
): { chord: string; start: number; end: number } | null {
  const before = doc.slice(0, pos);
  const after = doc.slice(pos);
  const lastOpen = before.lastIndexOf("[");
  const firstClose = after.indexOf("]");
  if (lastOpen === -1 || firstClose === -1) return null;
  const closePos = pos + firstClose;
  if (closePos < lastOpen) return null;
  const chordEnd = closePos + 1;
  const chordContent = doc.slice(lastOpen + 1, closePos);
  if (pos >= lastOpen && pos <= chordEnd) {
    return { chord: chordContent, start: lastOpen, end: chordEnd };
  }
  return null;
}

/**
 * Ajoute l'extension (7, 9 ou 11) à la fin de l'accord.
 * Comportement simple : concaténation (E + 7 = E7, E7 + 7 = E77).
 */
export function appendChordExtension(
  chord: string,
  ext: "7" | "9" | "11"
): string {
  return chord + ext;
}
