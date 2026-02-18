/**
 * Transpose un accord d'un nombre de demi-tons.
 * Ex: transposeChord("C", 2) => "D", transposeChord("Am", -2) => "Gm"
 * Gère les enharmoniques (Cb, Fb, E#, B#).
 */

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHROMATIC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/** Racines enharmoniques non présentes dans CHROMATIC/CHROMATIC_FLAT */
const ENHARMONIC: Record<string, number> = {
  Cb: 11,
  Fb: 4,
  "E#": 5,
  "B#": 0,
};

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

/** Retourne le demi-ton (0-11) ou -1 si racine non reconnue. */
function rootToSemitone(root: string): number {
  const enh = ENHARMONIC[root];
  if (enh !== undefined) return enh;
  const idx = CHROMATIC.indexOf(root);
  if (idx >= 0) return idx;
  const idxFlat = CHROMATIC_FLAT.indexOf(root);
  if (idxFlat >= 0) return idxFlat;
  return -1;
}

function semitoneToRoot(semi: number, preferSharp: boolean): string {
  const n = ((semi % 12) + 12) % 12;
  return preferSharp ? CHROMATIC[n]! : CHROMATIC_FLAT[n]!;
}

export function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const rootSemi = rootToSemitone(parsed.root);
  if (rootSemi < 0) return chord;
  const newRoot = semitoneToRoot(rootSemi + semitones, chord.includes("#"));
  let result = newRoot + parsed.suffix;
  if (parsed.bass) {
    const bassSemi = rootToSemitone(parsed.bass);
    if (bassSemi >= 0) {
      const newBass = semitoneToRoot(bassSemi + semitones, chord.includes("#"));
      result += "/" + newBass;
    } else {
      result += "/" + parsed.bass;
    }
  }
  return result;
}

/** Transpose les accords [...] et met à jour les directives {key: ...}. */
export function transposeChordProText(text: string, semitones: number): string {
  let result = text.replace(/\[([^\]]*)\]/g, (_, chordContent) => {
    const transposed = transposeChord(chordContent, semitones);
    return `[${transposed}]`;
  });
  result = result.replace(/\{key\s*:\s*([^}]+)\}/gi, (_, keyContent) => {
    const key = keyContent.trim();
    const transposed = transposeChord(key, semitones);
    return `{key: ${transposed}}`;
  });
  return result;
}
