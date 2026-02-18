import type { ChordProDocument, ChordProLine } from "./parse";

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
  lyricLine = padRight(lyricLine, chordLine.length);
  return { chords: chordLine, lyrics: lyricLine };
}

function padRight(s: string, len: number) {
  if (s.length >= len) return s;
  return s + " ".repeat(len - s.length);
}

/** Preview : 2 lignes par ligne de texte (accords puis paroles), alignement par caractères en monospace */
export function ChordProPreview({ doc }: { doc: ChordProDocument }) {
  const lines = renderChordProToLines(doc);
  return (
    <div className="text-sm leading-relaxed">
      {lines.map(({ chords, lyrics }, idx) => {
        const isEmpty = !chords && !lyrics;
        return (
          <div key={idx} className="mb-1 font-mono text-sm">
            {isEmpty ? (
              <div className="flex h-8 shrink-0 items-center" aria-hidden="true">
                <span className="invisible">{"\u00A0"}</span>
              </div>
            ) : (
              <>
                <div
                  className="min-h-[1.2em] font-medium text-indigo-600 dark:text-indigo-300"
                  style={{ whiteSpace: "pre" }}
                >
                  {chords}
                </div>
                <div
                  className="min-h-[1.2em] text-zinc-900 dark:text-zinc-100"
                  style={{ whiteSpace: "pre" }}
                >
                  {lyrics}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

