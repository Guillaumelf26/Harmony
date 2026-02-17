import { describe, expect, it } from "vitest";
import { parseChordPro } from "@/chordpro/parse";

describe("parseChordPro", () => {
  it("parses directives (title/artist/key)", () => {
    const doc = parseChordPro("{title: My Song}\n{artist: Me}\n{key: Am}\n");
    expect(doc.title).toBe("My Song");
    expect(doc.artist).toBe("Me");
    expect(doc.key).toBe("Am");
  });

  it("keeps empty lines", () => {
    const doc = parseChordPro("\n\nHello\n\n");
    expect(doc.lines.filter((l) => l.type === "empty").length).toBeGreaterThan(0);
  });

  it("parses chord segments", () => {
    const doc = parseChordPro("[Am]Bonjour [G]le monde");
    const textLine = doc.lines.find((l) => l.type === "text");
    expect(textLine && textLine.type === "text" ? textLine.segments : []).toMatchObject([
      { type: "chord", chord: "Am", lyricAfter: "Bonjour " },
      { type: "chord", chord: "G", lyricAfter: "le monde" },
    ]);
  });
});

