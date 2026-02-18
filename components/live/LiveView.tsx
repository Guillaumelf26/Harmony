"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseChordPro } from "@/chordpro/parse";
import { transposeChordProText } from "@/lib/transposeChord";
import { LiveToolbar } from "./LiveToolbar";
import { LiveContent } from "./LiveContent";

function isIOSStandalone() {
  if (typeof window === "undefined") return false;
  return (navigator as { standalone?: boolean }).standalone === true;
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

type Props = {
  songId: string;
  chordproText: string;
  title: string;
  artist: string | null;
  keyDisplay: string | null;
  audioUrl: string | null;
  referenceUrl: string | null;
};

export function LiveView({
  songId,
  chordproText,
  title,
  artist,
  keyDisplay,
  audioUrl,
  referenceUrl,
}: Props) {
  const router = useRouter();
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (document.fullscreenEnabled) {
      const el = document.documentElement;
      el.requestFullscreen().then(
        () => setIsFullscreen(true),
        () => {}
      );
      const handler = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handler);
      return () => document.removeEventListener("fullscreenchange", handler);
    }
    if (isIOS() && !isIOSStandalone() && !sessionStorage.getItem("harmony-ios-hint-dismissed")) {
      setShowIOSHint(true);
    }
  }, []);

  function handleExitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  const displayText = useMemo(
    () =>
      transposeSemitones === 0
        ? chordproText
        : transposeChordProText(chordproText, transposeSemitones),
    [chordproText, transposeSemitones]
  );
  const doc = useMemo(() => parseChordPro(displayText), [displayText]);

  function handleBack() {
    router.push(`/admin?song=${songId}`);
  }

  function dismissIOSHint() {
    setShowIOSHint(false);
    try {
      sessionStorage.setItem("harmony-ios-hint-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {showIOSHint ? (
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-800/90 text-zinc-200 text-sm border-b border-zinc-700">
          <span>
            Plein écran sur iPhone : partage → « Sur l&apos;écran d&apos;accueil »
          </span>
          <button
            type="button"
            onClick={dismissIOSHint}
            className="shrink-0 rounded p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : null}
      <LiveToolbar
        transposeSemitones={transposeSemitones}
        onTransposeChange={setTransposeSemitones}
        audioUrl={audioUrl}
        referenceUrl={referenceUrl}
        onBack={handleBack}
        isFullscreen={isFullscreen}
        onExitFullscreen={handleExitFullscreen}
      />
      <LiveContent doc={doc} title={title} artist={artist} keyDisplay={keyDisplay} />
    </div>
  );
}
