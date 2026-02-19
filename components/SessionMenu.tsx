"use client";

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
        <div className="absolute left-0 bottom-full mb-2 z-[200] min-w-[180px] rounded-xl bg-zinc-950 shadow-2xl py-2 border border-zinc-800/80">
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors touch-manipulation cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
            className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors touch-manipulation cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}
