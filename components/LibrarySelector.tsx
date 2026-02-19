"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useClickOutside } from "@/lib/useClickOutside";

export type LibraryItem = {
  id: string;
  name: string;
  isOwner?: boolean;
  _count?: { songs: number };
  owner?: { email: string };
};

type Props = {
  libraries: { owned: LibraryItem[]; shared: LibraryItem[] };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onJoinLibrary: () => void;
  onCreateLibrary: () => void;
};

export function LibrarySelector({
  libraries,
  selectedId,
  onSelect,
  onJoinLibrary,
  onCreateLibrary,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const allLibraries = [
    ...libraries.owned.map((l) => ({ ...l, isOwner: true })),
    ...libraries.shared.map((l) => ({ ...l, isOwner: false })),
  ];
  const selected = allLibraries.find((l) => l.id === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 flex items-center justify-between gap-2"
      >
        <span className="truncate">{selected?.name ?? "Sélectionner une bibliothèque"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white dark:bg-zinc-950 shadow-2xl py-2 border border-zinc-200 dark:border-zinc-800/80 max-h-64 overflow-auto outline-none">
          {libraries.owned.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Mes bibliothèques
              </div>
              {libraries.owned.map((lib) => (
                <button
                  key={lib.id}
                  type="button"
                  onClick={() => {
                    onSelect(lib.id);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 ${
                    selectedId === lib.id ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <span className="truncate">{lib.name}</span>
                  {lib._count?.songs != null ? (
                    <span className="text-xs text-zinc-500 shrink-0">{lib._count.songs}</span>
                  ) : null}
                </button>
              ))}
            </>
          ) : null}
          {libraries.shared.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider mt-2">
                Partagées
              </div>
              {libraries.shared.map((lib) => (
                <button
                  key={lib.id}
                  type="button"
                  onClick={() => {
                    onSelect(lib.id);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 ${
                    selectedId === lib.id ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{lib.name}</span>
                    {lib.owner?.email && (
                      <span className="text-xs text-zinc-500 block truncate">par {lib.owner.email}</span>
                    )}
                  </div>
                  {lib._count?.songs != null ? (
                    <span className="text-xs text-zinc-500 shrink-0">{lib._count.songs}</span>
                  ) : null}
                </button>
              ))}
            </>
          ) : null}
          <div className="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-2">
            <Link
              href="/admin/libraries"
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Gérer les bibliothèques
            </Link>
            <button
              type="button"
              onClick={() => {
                onJoinLibrary();
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Rejoindre une bibliothèque
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateLibrary();
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Créer une bibliothèque
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
