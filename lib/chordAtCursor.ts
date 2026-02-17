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
 * Retourne l'extension actuelle (7, 9 ou 11) à la fin de l'accord, ou null.
 */
export function getChordExtension(chord: string): "7" | "9" | "11" | null {
  if (chord.endsWith("11")) return "11";
  if (chord.endsWith("9")) return "9";
  if (chord.endsWith("7")) return "7";
  return null;
}

/**
 * Base de l'accord sans extension 7/9/11.
 */
export function getChordBase(chord: string): string {
  if (chord.endsWith("11")) return chord.slice(0, -2);
  if (chord.endsWith("9")) return chord.slice(0, -1);
  if (chord.endsWith("7")) return chord.slice(0, -1);
  return chord;
}

/**
 * Applique ou retire l'extension (7, 9 ou 11) sur l'accord.
 * - Si l'accord a déjà cette extension : la retire (toggle off)
 * - Sinon : remplace l'extension existante ou ajoute la nouvelle
 */
export function toggleChordExtension(
  chord: string,
  ext: "7" | "9" | "11"
): string {
  const base = getChordBase(chord);
  const current = getChordExtension(chord);
  if (current === ext) return base;
  return base + ext;
}
