"use client";

import type { ChordProDocument } from "@/chordpro/parse";
import { ChordProPreview } from "@/chordpro/render";

type Props = {
  doc: ChordProDocument;
  title: string;
  artist: string | null;
  keyDisplay: string | null;
};

/**
 * Rendu du contenu ChordPro en mode live.
 * Utilise les métadonnées du doc (parsing) avec fallback sur les données du chant.
 */
export function LiveContent({ doc, title, artist, keyDisplay }: Props) {
  const displayDoc: ChordProDocument = {
    ...doc,
    title: doc.title || title,
    artist: (doc.artist || artist) ?? undefined,
    key: (doc.key || keyDisplay) ?? undefined,
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto overscroll-contain px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="border border-transparent p-6">
          <ChordProPreview doc={displayDoc} />
        </div>
      </div>
    </div>
  );
}
