"use client";

import { useEffect, useRef } from "react";

/**
 * Hook pour empêcher la mise en veille de l'écran sur mobile (Screen Wake Lock API).
 * Similaire au comportement de YouTube pendant la lecture.
 * @param enabled - Si true, active le wake lock lorsque la page est visible
 */
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    async function requestLock() {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        wakeLockRef.current = sentinel;
        sentinel.addEventListener(
          "release",
          () => {
            wakeLockRef.current = null;
          },
          { once: true }
        );
      } catch {
        // Silently ignore (battery save mode, low battery, etc.)
      }
    }

    async function releaseLock() {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          /* ignore */
        }
        wakeLockRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestLock();
      } else {
        releaseLock();
      }
    }

    requestLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
    };
  }, [enabled]);
}
