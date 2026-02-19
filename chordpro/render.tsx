import type { ReactNode } from "react";
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
      if (line.directive.type === "title" || line.directive.type === "artist" || line.directive.type === "key") {
        continue;
      }
      lines.push({ chords: "", lyrics: `${line.directive.name}: ${line.directive.value}` });
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
export function ChordProPreview({ doc, renderTitleRight }: { doc: ChordProDocument; renderTitleRight?: () => ReactNode }) {
  const lines = renderChordProToLines(doc);
  return (
    <div className="text-sm leading-relaxed">
      {doc.title || renderTitleRight ? (
        <div className="flex items-center justify-between gap-3 mb-1">
          {doc.title ? (
            <h2 className="text-2xl md:text-3xl font-lora font-medium text-zinc-900 dark:text-zinc-100 min-w-0 flex-1">
              {doc.title}
            </h2>
          ) : <span className="flex-1" />}
          {renderTitleRight?.()}
        </div>
      ) : null}
      <div className="flex items-center gap-2 mb-4">
        {doc.artist ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{doc.artist}</span>
        ) : null}
        {doc.artist && doc.key ? (
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
        ) : null}
        {doc.key ? (
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{doc.key}</span>
        ) : null}
      </div>
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
                  className="min-h-[1.2em] font-medium"
                  style={{ whiteSpace: "pre", color: "#ffb900" }}
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

