"use client";

import { applyTheme } from "@/lib/theme";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function getInitial(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const first = name.trim().split(/\s+/)[0];
    return first[0]?.toUpperCase() ?? "?";
  }
  if (email?.trim()) {
    return email.trim()[0]?.toUpperCase() ?? "?";
  }
  return "?";
}

export function SessionMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: { theme?: string }) => {
        const t = (p?.theme ?? "dark") as "light" | "dark";
        setThemeState(t);
      });
  }, [open]);

  async function handleThemeChange(next: "light" | "dark") {
    setThemeState(next);
    applyTheme(next);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
    } catch {
      // keep UI in sync; cookie already set by applyTheme
    }
  }

  if (status === "loading") {
    return (
      <div className="text-xs text-zinc-500 dark:text-zinc-500">Chargement…</div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-800"
      >
        Se connecter
      </Link>
    );
  }

  const initial = getInitial(session.user.name, session.user.email);
  const displayName = session.user.name?.trim() || session.user.email || "Compte";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors touch-manipulation cursor-pointer"
        title={session.user.email ?? session.user.name ?? undefined}
      >
        {initial}
      </button>
      {open ? (
        <div className="absolute right-0 bottom-full mb-2 z-[200] w-[280px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {displayName}
            </p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Thème</span>
            <div
              className="flex rounded-full p-1 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner"
              role="group"
              aria-label="Choisir le thème"
            >
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                  theme === "light"
                    ? "bg-white dark:bg-zinc-100 text-amber-500 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title="Clair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-zinc-700 dark:bg-zinc-600 text-indigo-200 shadow-sm ring-1 ring-zinc-600 dark:ring-zinc-500"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title="Sombre"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="py-1">
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500 dark:text-zinc-400">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Paramètres
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut({ callbackUrl: "/login" });
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500 dark:text-zinc-400">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
