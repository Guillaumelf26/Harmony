export type ChordProDirective =
  | { type: "title"; value: string }
  | { type: "artist"; value: string }
  | { type: "key"; value: string }
  | { type: "unknown"; name: string; value: string };

export type ChordProSegment =
  | { type: "lyric"; text: string }
  | { type: "chord"; chord: string; lyricAfter: string };

export type ChordProLine =
  | { type: "empty" }
  | { type: "directive"; directive: ChordProDirective }
  | { type: "text"; segments: ChordProSegment[]; raw: string };

export type ChordProDocument = {
  title?: string;
  artist?: string;
  key?: string;
  lines: ChordProLine[];
};

const directiveRe = /^\{([^:}]+)\s*:\s*(.*?)\s*\}$/;

export function parseChordPro(input: string): ChordProDocument {
  const doc: ChordProDocument = { lines: [] };
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    if (line.trim() === "") {
      doc.lines.push({ type: "empty" });
      continue;
    }

    const m = directiveRe.exec(line.trim());
    if (m) {
      const name = m[1]!.trim().toLowerCase();
      const value = m[2]!.trim();
      let directive: ChordProDirective;
      if (name === "title") {
        doc.title = value;
        directive = { type: "title", value };
      } else if (name === "artist") {
        doc.artist = value;
        directive = { type: "artist", value };
      } else if (name === "key") {
        doc.key = value;
        directive = { type: "key", value };
      } else {
        directive = { type: "unknown", name, value };
      }
      doc.lines.push({ type: "directive", directive });
      continue;
    }

    doc.lines.push({
      type: "text",
      raw: line,
      segments: parseLineSegments(line),
    });
  }

  return doc;
}

function parseLineSegments(line: string): ChordProSegment[] {
  const out: ChordProSegment[] = [];
  let i = 0;
  let lyricBuf = "";

  function flushLyric() {
    if (lyricBuf) {
      out.push({ type: "lyric", text: lyricBuf });
      lyricBuf = "";
    }
  }

  while (i < line.length) {
    const ch = line[i]!;
    if (ch !== "[") {
      lyricBuf += ch;
      i += 1;
      continue;
    }

    // chord start
    const end = line.indexOf("]", i + 1);
    if (end === -1) {
      // unmatched '[' -> treat as lyric
      lyricBuf += ch;
      i += 1;
      continue;
    }

    const chord = line.slice(i + 1, end);
    flushLyric();

    // collect immediate lyric after chord until next '[' or end
    let j = end + 1;
    let after = "";
    while (j < line.length && line[j] !== "[") {
      after += line[j]!;
      j += 1;
    }

    out.push({ type: "chord", chord, lyricAfter: after });
    i = j;
  }

  flushLyric();
  return out;
}

