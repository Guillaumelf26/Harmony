"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseChordPro } from "@/chordpro/parse";
import { transposeChordProText } from "@/lib/transposeChord";
import { LiveToolbar } from "./LiveToolbar";
import { LiveContent } from "./LiveContent";

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

  useEffect(() => {
    if (!document.fullscreenEnabled) return;
    const el = document.documentElement;
    el.requestFullscreen().then(
      () => setIsFullscreen(true),
      () => {}
    );
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
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

  return (
    <div className="flex flex-col h-full min-h-0">
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
