"use client";

import { useMemo } from "react";
import { parseChordPro } from "@/chordpro/parse";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { ChordProPreview } from "@/chordpro/render";
import { transposeChordProText } from "@/lib/transposeChord";

type Props = {
  chordproText: string;
  audioUrl: string | null;
  songId: string;
  transposeSemitones: number;
  onEditClick: () => void;
  /** Quand true, le player ne doit pas chevaucher le volet gauche (sidebar) */
  sidebarOpen?: boolean;
};

export function SongReadingView({
  chordproText,
  audioUrl,
  songId,
  transposeSemitones,
  onEditClick,
  sidebarOpen = false,
}: Props) {
  const displayText = useMemo(
    () => (transposeSemitones === 0 ? chordproText : transposeChordProText(chordproText, transposeSemitones)),
    [chordproText, transposeSemitones]
  );
  const doc = useMemo(() => parseChordPro(displayText), [displayText]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Contenu : preview - sans encadré visible */}
      <div className={`flex-1 min-h-0 overflow-auto px-4 py-6 ${audioUrl ? "pb-24" : ""}`}>
        <div className="mx-auto max-w-2xl">
          <div className="border border-transparent bg-transparent p-6">
            <ChordProPreview doc={doc} />
          </div>
        </div>
      </div>

      {/* Player audio fixe en bas, style Spotify (ne chevauche pas le volet gauche) */}
      {audioUrl ? (
        <div
          className={`fixed bottom-0 right-0 z-50 flex items-center justify-center px-4 py-4 backdrop-blur-md bg-black/40 dark:bg-zinc-950/70 ${sidebarOpen ? "left-72 xl:left-80" : "left-0"}`}
        >
          <AudioPlayerBar src={audioUrl} />
        </div>
      ) : null}
    </div>
  );
}
