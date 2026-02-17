/**
 * Trouve l'accord [xxx] contenant la position pos.
 * Retourne null si le curseur n'est pas à l'intérieur d'un accord.
 */
export function getChordAtCursor(
  pos: number,
  doc: string
): { chord: string; start: number; end: number } | null {
  const lastOpen = doc.slice(0, pos + 1).lastIndexOf("[");
  if (lastOpen === -1) return null;
  const endBracket = doc.indexOf("]", lastOpen);
  if (endBracket === -1) return null;
  const chordEnd = endBracket + 1;
  if (pos < lastOpen || pos > endBracket) return null;
  const chordContent = doc.slice(lastOpen + 1, endBracket);
  return { chord: chordContent, start: lastOpen, end: chordEnd };
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
