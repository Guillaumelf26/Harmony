"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseChordPro } from "@/chordpro/parse";
import { ChordProPreview } from "@/chordpro/render";
import { transposeChordProText } from "@/lib/transposeChord";

const FAVORITES_KEY = "harmony-favorites";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function toggleFavorite(id: string): boolean {
  const fav = getFavorites();
  const idx = fav.indexOf(id);
  const isNow = idx < 0;
  if (isNow) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...fav, id]));
  } else {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(fav.filter((x) => x !== id)));
  }
  return isNow;
}

type Props = {
  chordproText: string;
  referenceUrl: string | null;
  audioUrl: string | null;
  songId: string;
  onEditClick: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
};

export function SongReadingView({
  chordproText,
  referenceUrl,
  audioUrl,
  songId,
  onEditClick,
  onImport,
  onExport,
  onDelete,
}: Props) {
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [isFavorite, setIsFavorite] = useState(() => getFavorites().includes(songId));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const displayText = useMemo(
    () => (transposeSemitones === 0 ? chordproText : transposeChordProText(chordproText, transposeSemitones)),
    [chordproText, transposeSemitones]
  );
  const doc = useMemo(() => parseChordPro(displayText), [displayText]);

  function handleToggleFavorite() {
    const now = toggleFavorite(songId);
    setIsFavorite(now);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Barre d'outils lecture */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Transposer :</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setTransposeSemitones((n) => Math.max(-12, n - 1))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-2.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="-1 demi-ton"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {transposeSemitones === 0 ? "0" : transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
              </span>
              <button
                type="button"
                onClick={() => setTransposeSemitones((n) => Math.min(12, n + 1))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-2.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="+1 demi-ton"
              >
                +
              </button>
              {transposeSemitones !== 0 ? (
                <button
                  type="button"
                  onClick={() => setTransposeSemitones(0)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors ml-1"
                  title="Réinitialiser"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
          {referenceUrl?.trim() ? (
            <a
              href={referenceUrl.trim().startsWith("http") ? referenceUrl.trim() : `https://${referenceUrl.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gradient-to-r from-accent-500/60 to-accent-600/60 hover:from-accent-600 hover:to-accent-700 p-2 text-white transition-all"
              title="Ouvrir le lien"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`rounded-lg p-2 transition-all ${
              isFavorite
                ? "bg-accent-500/20 text-accent-600 dark:text-accent-400 hover:bg-accent-500/30"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
            }`}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
          {audioUrl ? (
            <div className="flex-1 min-w-[280px] max-w-[420px]">
              <audio src={audioUrl} controls className="audio-player w-full h-8" />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            {(onImport || onExport || onDelete) ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  title="Menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="12" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                  </svg>
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-xl bg-zinc-950 shadow-2xl py-2 border border-zinc-800/80">
                    {onImport ? (
                      <button
                        type="button"
                        onClick={() => {
                          onImport();
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import
                      </button>
                    ) : null}
                    {onExport ? (
                      <button
                        type="button"
                        onClick={() => {
                          onExport();
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete();
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Supprimer le chant
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onEditClick}
            className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 p-2 text-white hover:from-accent-600 hover:to-accent-700 transition-all"
            title="Modifier le chant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu : preview - sans encadré visible */}
      <div className="flex-1 min-h-0 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="border border-transparent bg-transparent p-6">
            <ChordProPreview doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}
