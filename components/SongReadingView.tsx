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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function SongReadingView({
  chordproText,
  audioUrl,
  songId,
  transposeSemitones,
  onEditClick,
  isFavorite = false,
  onToggleFavorite,
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
        <div className="mx-auto max-w-2xl min-w-0">
          <div className="border border-transparent bg-transparent p-6">
            <ChordProPreview
              doc={doc}
              renderTitleRight={onToggleFavorite ? () => (
                <button
                  type="button"
                  onClick={() => onToggleFavorite()}
                  className={`shrink-0 p-2 rounded-lg transition-colors touch-manipulation ${isFavorite ? "text-accent-500 dark:text-accent-400 bg-accent-500/10 dark:bg-accent-500/20" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"}`}
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </button>
              ) : undefined}
            />
          </div>
        </div>
      </div>

      {audioUrl ? (
        <div className="fixed left-0 right-0 bottom-0 z-40 flex items-center justify-center py-4 px-4 backdrop-blur-md bg-black/20 dark:bg-zinc-950/70 border-t border-black/10 dark:border-zinc-800/50">
          <AudioPlayerBar src={audioUrl} />
        </div>
      ) : null}
    </div>
  );
}
