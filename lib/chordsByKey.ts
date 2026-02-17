/**
 * Accords diatoniques majeurs par tonalité : I, IV, V, ii, iii, vi
 * (ordre pratique pour boutons : tonique, sous-dominante, dominante, puis mineurs)
 */

const CHORDS_BY_KEY: Record<string, string[]> = {
  C: ["C", "F", "G", "Dm", "Em", "Am"],
  "C#": ["C#", "F#", "G#", "D#m", "E#m", "A#m"],
  Db: ["Db", "Gb", "Ab", "Ebm", "Fm", "Bbm"],
  D: ["D", "G", "A", "Em", "F#m", "Bm"],
  "D#": ["D#", "G#", "A#", "Fm", "Gm", "Cm"],
  Eb: ["Eb", "Ab", "Bb", "Fm", "Gm", "Cm"],
  E: ["E", "A", "B", "F#m", "G#m", "C#m"],
  F: ["F", "Bb", "C", "Gm", "Am", "Dm"],
  "F#": ["F#", "B", "C#", "G#m", "A#m", "D#m"],
  Gb: ["Gb", "Cb", "Db", "Abm", "Bbm", "Ebm"],
  G: ["G", "C", "D", "Am", "Bm", "Em"],
  "G#": ["G#", "C#", "D#", "A#m", "B#m", "E#m"],
  Ab: ["Ab", "Db", "Eb", "Bbm", "Cm", "Fm"],
  A: ["A", "D", "E", "Bm", "C#m", "F#m"],
  "A#": ["A#", "D#", "E#", "Cm", "Dm", "Gm"],
  Bb: ["Bb", "Eb", "F", "Cm", "Dm", "Gm"],
  B: ["B", "E", "F#", "G#m", "A#m", "C#m"],
};

const KEY_ALIASES: Record<string, string> = {
  "do": "C",
  "ré": "D",
  "re": "D",
  "mi": "E",
  "fa": "F",
  "sol": "G",
  "la": "A",
  "si": "B",
  "do#": "C#",
  "ré#": "D#",
  "re#": "D#",
  "fa#": "F#",
  "sol#": "G#",
  "la#": "A#",
  "sib": "Bb",
  "mib": "Eb",
  "lab": "Ab",
  "réb": "Db",
  "reb": "Db",
  "solb": "Gb",
};

/** Normalise la tonalité saisie (ex: "e", "E", "Mi" -> "E") et retourne la clé reconnue ou null */
function normalizeKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower];
  const first = trimmed.charAt(0).toUpperCase();
  const rest = trimmed.slice(1).replace(/\s/g, "");
  const key = rest ? `${first}${rest}` : first;
  return CHORDS_BY_KEY[key] ? key : null;
}

/**
 * Retourne la liste des 6 accords (I, IV, V, ii, iii, vi) pour la tonalité donnée.
 * Si la tonalité n'est pas reconnue, retourne un tableau vide.
 */
export function getChordsForKey(keyInput: string): string[] {
  const key = normalizeKey(keyInput);
  if (!key) return [];
  return [...CHORDS_BY_KEY[key]];
}
