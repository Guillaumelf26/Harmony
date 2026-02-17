import type {
  ChordProDocument,
  ChordProLine,
  ChordProSegment,
} from "./parse";

type RenderLine = { chords: string; lyrics: string };

export function renderChordProToLines(doc: ChordProDocument): RenderLine[] {
  const lines: RenderLine[] = [];
  for (const line of doc.lines) {
    if (line.type === "empty") {
      lines.push({ chords: "", lyrics: "" });
      continue;
    }
    if (line.type === "directive") {
      const label =
        line.directive.type === "title"
          ? "Titre"
          : line.directive.type === "artist"
            ? "Artiste"
            : line.directive.type === "key"
              ? "Tonalité"
              : line.directive.name;
      lines.push({ chords: "", lyrics: `${label}: ${line.directive.value}` });
      continue;
    }
    lines.push(renderTextLine(line));
  }
  return lines;
}

function renderTextLine(line: Extract<ChordProLine, { type: "text" }>): RenderLine {
  let chordLine = "";
  let lyricLine = "";
  const segments = line.segments;
  for (const seg of segments) {
    if (seg.type === "lyric") {
      chordLine += " ".repeat(seg.text.length);
      lyricLine += seg.text;
      continue;
    }
    chordLine = padRight(chordLine, lyricLine.length);
    chordLine += seg.chord;
    lyricLine += seg.lyricAfter;
    chordLine = padRight(chordLine, lyricLine.length);
  }
  chordLine = padRight(chordLine, lyricLine.length);
  return { chords: chordLine, lyrics: lyricLine };
}

function padRight(s: string, len: number) {
  if (s.length >= len) return s;
  return s + " ".repeat(len - s.length);
}

/** Preview : une grille 2 lignes (accords / paroles) par ligne ChordPro, une colonne par segment */
export function ChordProPreview({ doc }: { doc: ChordProDocument }) {
  return (
    <div className="text-sm leading-relaxed">
      {doc.lines.map((line, idx) => {
        if (line.type === "empty") {
          return <div key={idx} className="min-h-[1.5em]" />;
        }
        if (line.type === "directive") {
          const label =
            line.directive.type === "title"
              ? "Titre"
              : line.directive.type === "artist"
                ? "Artiste"
                : line.directive.type === "key"
                  ? "Tonalité"
                  : line.directive.name;
          return (
            <div key={idx} className="py-0.5 text-zinc-400">
              {label}: {line.directive.value}
            </div>
          );
        }
        // Deux lignes (accords / paroles) en spans inline-block pour éviter tout espace entre segments
        const segments = line.segments;
        return (
          <div key={idx} className="mb-1 font-mono text-sm">
            <div className="leading-tight pt-0.5 pb-0 text-xs font-medium text-indigo-300">
              {segments.map((seg, i) => {
                const w =
                  seg.type === "lyric"
                    ? `${seg.text.length}ch`
                    : `${Math.max(2, seg.lyricAfter.length)}ch`;
                return (
                  <span
                    key={i}
                    className="inline-block align-top"
                    style={{ width: w, minWidth: w }}
                  >
                    {seg.type === "chord" ? seg.chord : "\u00A0"}
                  </span>
                );
              })}
            </div>
            <div className="leading-tight pb-0.5 break-words">
              {segments.map((seg, i) => {
                const w =
                  seg.type === "lyric"
                    ? `${seg.text.length}ch`
                    : `${Math.max(2, seg.lyricAfter.length)}ch`;
                return (
                  <span
                    key={i}
                    className="inline-block align-top"
                    style={{
                      width: w,
                      minWidth: w,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {seg.type === "lyric" ? seg.text : seg.lyricAfter}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

