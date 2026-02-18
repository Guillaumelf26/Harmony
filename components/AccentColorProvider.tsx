"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_ACCENT = "#FA7A5F";

type AccentContextValue = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const AccentColorContext = createContext<AccentContextValue | null>(null);

function applyAccentColor(color: string) {
  document.documentElement.style.setProperty("--color-accent", color);
}

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    applyAccentColor(color);
  }, []);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((prefs: { accentColor?: string } | null) => {
        const color = prefs?.accentColor ?? DEFAULT_ACCENT;
        setAccentColorState(color);
        applyAccentColor(color);
      })
      .catch(() => applyAccentColor(DEFAULT_ACCENT));
  }, []);

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  return ctx ?? { accentColor: DEFAULT_ACCENT, setAccentColor: () => {} };
}
