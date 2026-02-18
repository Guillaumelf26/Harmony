import { describe, it, expect } from "vitest";
import { transposeChord, transposeChordProText } from "@/lib/transposeChord";

describe("transposeChord", () => {
  it("transpose les accords de base", () => {
    expect(transposeChord("C", 2)).toBe("D");
    expect(transposeChord("Am", -2)).toBe("Gm");
    expect(transposeChord("G", 4)).toBe("B");
  });

  it("gère les enharmoniques Cb, Fb, E#, B#", () => {
    expect(transposeChord("Cb", 1)).toBe("C");
    expect(transposeChord("Cb", 0)).toBe("B");
    expect(transposeChord("Fb", 1)).toBe("F");
    expect(transposeChord("E#", 1)).toBe("F#");
    expect(transposeChord("B#", 1)).toBe("C#");
  });

  it("retourne l'accord inchangé si racine non reconnue", () => {
    expect(transposeChord("Xm", 2)).toBe("Xm");
    expect(transposeChord("H", 2)).toBe("H");
  });

  it("gère les accords avec basse", () => {
    expect(transposeChord("C/E", 2)).toMatch(/^D\/(F#|Gb)$/);
    expect(transposeChord("Am/C#", 2)).toBe("Bm/D#");
  });
});

describe("transposeChordProText", () => {
  it("transpose les accords entre crochets", () => {
    expect(transposeChordProText("[C] [Am] [F] [G]", 2)).toBe("[D] [Bm] [G] [A]");
  });

  it("met à jour la directive {key: ...}", () => {
    expect(transposeChordProText("{key: C}\n[C]Hello", 2)).toBe("{key: D}\n[D]Hello");
    expect(transposeChordProText("{key: Am}\n[Am]Verse", -2)).toBe("{key: Gm}\n[Gm]Verse");
  });

  it("préserve le texte hors accords", () => {
    const input = "{title: Test}\n{key: G}\n[G]Paroles [C]ici";
    const result = transposeChordProText(input, 2);
    expect(result).toContain("{title: Test}");
    expect(result).toContain("{key: A}");
    expect(result).toContain("[A]Paroles [D]ici");
  });
});
