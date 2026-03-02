import { describe, expect, it } from "vitest";
import { parseChordPro, stripMetadataDirectives, prependMetadataDirectives } from "@/chordpro/parse";

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

  it("stripMetadataDirectives removes title/artist/key lines", () => {
    const input = "{title: My Song}\n{artist: Me}\n{key: Am}\n\n[C]Verse";
    expect(stripMetadataDirectives(input)).toBe("[C]Verse");
  });

  it("stripMetadataDirectives preserves other content", () => {
    const input = "[Am]Bonjour le monde";
    expect(stripMetadataDirectives(input)).toBe("[Am]Bonjour le monde");
  });

  it("prependMetadataDirectives adds directives when values provided", () => {
    const body = "[C]Verse";
    const result = prependMetadataDirectives(body, "My Song", "Me", "Am");
    expect(result).toContain("{title: My Song}");
    expect(result).toContain("{artist: Me}");
    expect(result).toContain("{key: Am}");
    expect(result).toContain("[C]Verse");
  });

  it("prependMetadataDirectives omits empty values", () => {
    const body = "[C]Verse";
    const result = prependMetadataDirectives(body, "Title", "", "");
    expect(result).toBe("{title: Title}\n\n[C]Verse");
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

