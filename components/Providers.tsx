"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AccentColorProvider } from "./AccentColorProvider";
import { FavoritesProvider } from "./FavoritesProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AccentColorProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AccentColorProvider>
    </SessionProvider>
  );
}
