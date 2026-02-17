import { describe, expect, it } from "vitest";
import { parseChordPro } from "@/chordpro/parse";
import { renderChordProToLines } from "@/chordpro/render";

describe("renderChordProToLines", () => {
  it("renders chords above lyrics (basic alignment)", () => {
    const doc = parseChordPro("[Am]Bonjour [G]le monde");
    const lines = renderChordProToLines(doc);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.lyrics).toBe("Bonjour le monde");
    expect(lines[0]!.chords.replace(/\s+/g, " ").trim()).toContain("Am");
    expect(lines[0]!.chords.replace(/\s+/g, " ").trim()).toContain("G");
    expect(lines[0]!.chords.length).toBe(lines[0]!.lyrics.length);
  });

  it("renders plain text without chords", () => {
    const doc = parseChordPro("Hello");
    const [line] = renderChordProToLines(doc);
    expect(line!.lyrics).toBe("Hello");
    expect(line!.chords).toBe("     ");
  });
});

