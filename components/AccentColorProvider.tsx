"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const DEFAULT_ACCENT = "#FA7A5F";

type AccentContextValue = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const AccentColorContext = createContext<AccentContextValue | null>(null);

export function AccentColorProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", DEFAULT_ACCENT);
  }, []);

  return (
    <AccentColorContext.Provider
      value={{ accentColor: DEFAULT_ACCENT, setAccentColor: () => {} }}
    >
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor(): AccentContextValue {
  const ctx = useContext(AccentColorContext);
  return ctx ?? { accentColor: DEFAULT_ACCENT, setAccentColor: () => {} };
}
