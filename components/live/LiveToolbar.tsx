"use client";

type Props = {
  transposeSemitones: number;
  onTransposeChange: (n: number) => void;
  audioUrl: string | null;
  referenceUrl: string | null;
  onBack: () => void;
  isFullscreen: boolean;
  onExitFullscreen: () => void;
};

export function LiveToolbar({
  transposeSemitones,
  onTransposeChange,
  audioUrl,
  referenceUrl,
  onBack,
  isFullscreen,
  onExitFullscreen,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
      <div className="flex items-center gap-3">
        {isFullscreen ? (
          <button
            type="button"
            onClick={onExitFullscreen}
            className="rounded-lg p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            title="Quitter le plein écran"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
          title="Retour"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-500">Transposer :</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onTransposeChange(Math.max(-12, transposeSemitones - 1))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="-1 demi-ton"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-medium text-zinc-300">
              {transposeSemitones === 0 ? "0" : transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
            </span>
            <button
              type="button"
              onClick={() => onTransposeChange(Math.min(12, transposeSemitones + 1))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="+1 demi-ton"
            >
              +
            </button>
            {transposeSemitones !== 0 ? (
              <button
                type="button"
                onClick={() => onTransposeChange(0)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 transition-colors ml-1"
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
            className="rounded-lg bg-accent-500/60 hover:bg-accent-500/80 p-2 text-white transition-colors"
            title="Ouvrir le lien"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : null}
        {audioUrl ? (
          <div className="flex-1 min-w-[200px] max-w-[360px]">
            <audio src={audioUrl} controls className="audio-player w-full h-8" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
