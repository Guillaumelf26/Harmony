"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AccentColorProvider } from "./AccentColorProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AccentColorProvider>{children}</AccentColorProvider>
    </SessionProvider>
  );
}
