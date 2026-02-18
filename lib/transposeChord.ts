/**
 * Transpose un accord d'un nombre de demi-tons.
 * Ex: transposeChord("C", 2) => "D", transposeChord("Am", -2) => "Gm"
 */

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHROMATIC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function parseChord(chord: string): { root: string; suffix: string; bass?: string } | null {
  const m = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  const root = m[1]!;
  const rest = m[2]!;
  const slashIdx = rest.indexOf("/");
  const main = slashIdx >= 0 ? rest.slice(0, slashIdx) : rest;
  const bass = slashIdx >= 0 ? rest.slice(slashIdx + 1) : undefined;
  return { root, suffix: main, bass: bass || undefined };
}

function rootToSemitone(root: string): number {
  const idx = CHROMATIC.indexOf(root);
  if (idx >= 0) return idx;
  const idxFlat = CHROMATIC_FLAT.indexOf(root);
  if (idxFlat >= 0) return idxFlat;
  return 0;
}

function semitoneToRoot(semi: number, preferSharp: boolean): string {
  const n = ((semi % 12) + 12) % 12;
  return preferSharp ? CHROMATIC[n]! : CHROMATIC_FLAT[n]!;
}

export function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const rootSemi = rootToSemitone(parsed.root);
  const newRoot = semitoneToRoot(rootSemi + semitones, chord.includes("#"));
  let result = newRoot + parsed.suffix;
  if (parsed.bass) {
    const bassSemi = rootToSemitone(parsed.bass);
    const newBass = semitoneToRoot(bassSemi + semitones, chord.includes("#"));
    result += "/" + newBass;
  }
  return result;
}

export function transposeChordProText(text: string, semitones: number): string {
  return text.replace(/\[([^\]]*)\]/g, (_, chordContent) => {
    const transposed = transposeChord(chordContent, semitones);
    return `[${transposed}]`;
  });
}
