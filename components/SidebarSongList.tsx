"use client";

import { useState, useRef } from "react";
import { useFavorites } from "@/components/FavoritesProvider";
import { useClickOutside } from "@/lib/useClickOutside";

type SongListItem = {
  id: string;
  title: string;
  artist: string | null;
  updatedAt: string;
  tags: string[];
};

type Props = {
  collapsed?: boolean;
  onToggleCollapsed: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  sortBy?: "title" | "artist" | "updatedAt";
  sortOrder?: "asc" | "desc";
  onSortChange?: (by: "title" | "artist" | "updatedAt", order: "asc" | "desc") => void;
  filterFavorites?: "all" | "favorites";
  onFilterFavoritesChange?: (v: "all" | "favorites") => void;
  songs: SongListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSongHover?: (id: string) => void;
  onSongHoverCancel?: () => void;
  onNew?: () => void;
  /** Mode overlay : bouton fermer (×) au lieu de « */
  overlay?: boolean;
  /** Masquer le bouton replier (utilisé quand un autre bouton le fait, ex. dans le header) */
  hideCollapseButton?: boolean;
};

export function SidebarSongList({
  collapsed = false,
  onToggleCollapsed,
  query,
  onQueryChange,
  sortBy = "updatedAt",
  sortOrder = "desc",
  onSortChange,
  filterFavorites = "all",
  onFilterFavoritesChange,
  songs,
  selectedId,
  onSelect,
  onSongHover,
  onSongHoverCancel,
  onNew,
  overlay = false,
  hideCollapseButton = false,
}: Props) {
  const { favorites } = useFavorites();
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const filteredSongs =
    filterFavorites === "favorites"
      ? songs.filter((s) => favorites.includes(s.id))
      : songs;

  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen);
  useClickOutside(sortRef, () => setSortOpen(false), sortOpen);

  const sortOptions: { value: string; label: string }[] = [
    { value: "updatedAt-desc", label: "Plus récent" },
    { value: "updatedAt-asc", label: "Plus ancien" },
    { value: "title-asc", label: "Titre A-Z" },
    { value: "title-desc", label: "Titre Z-A" },
    { value: "artist-asc", label: "Artiste A-Z" },
    { value: "artist-desc", label: "Artiste Z-A" },
  ];
  const currentLabel = sortOptions.find((o) => o.value === `${sortBy}-${sortOrder}`)?.label ?? "Plus récent";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none border-0 bg-white/90 dark:bg-zinc-950/30">
      {!hideCollapseButton ? (
        <div className="flex shrink-0 items-center justify-end border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
          <button
            onClick={onToggleCollapsed}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title={overlay ? "Fermer le panneau" : "Rétracter"}
          >
            {overlay ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              collapsed ? "»" : "«"
            )}
          </button>
        </div>
      ) : null}

      {collapsed ? null : (
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Recherche titre / artiste"
              className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors sidebar-search-input"
            />
            {onNew ? (
              <button
                type="button"
                onClick={onNew}
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 border border-zinc-200 dark:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                title="Nouveau chant"
                aria-label="Nouveau chant"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </button>
            ) : null}
          </div>
          {(onSortChange || onFilterFavoritesChange) ? (
            <div className="flex flex-wrap gap-2 items-center">
          {onFilterFavoritesChange ? (
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500 flex items-center gap-2 min-w-[100px] justify-between"
              >
                <span>{filterFavorites === "favorites" ? "Favoris" : "Tout"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={filterOpen ? "rotate-180" : ""}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {filterOpen ? (
                <div className="absolute left-0 top-full mt-2 z-50 min-w-[140px] rounded-xl bg-white dark:bg-zinc-950 shadow-2xl py-2 border border-zinc-200 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterFavoritesChange("all");
                      setFilterOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${filterFavorites === "all" ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"}`}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterFavoritesChange("favorites");
                      setFilterOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${filterFavorites === "favorites" ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filterFavorites === "favorites" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    Favoris
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {onSortChange ? (
            <div className="relative" ref={sortRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500 flex items-center gap-2 min-w-[140px] justify-between"
                >
                  <span>{currentLabel}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sortOpen ? "rotate-180" : ""}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {sortOpen ? (
                  <div className="absolute left-0 top-full mt-2 z-50 min-w-[180px] rounded-xl bg-white dark:bg-zinc-950 shadow-2xl py-2 border border-zinc-200 dark:border-zinc-800/80">
                    {sortOptions.map((opt) => {
                      const active = opt.value === `${sortBy}-${sortOrder}`;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const [by, order] = opt.value.split("-") as ["title" | "artist" | "updatedAt", "asc" | "desc"];
                            onSortChange(by, order);
                            setSortOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 ${
                            active ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
        </div>
      )}

      <div className={`flex-1 min-h-0 overflow-auto space-y-1 ${collapsed ? "p-2" : "px-2 pb-2"}`}>
        {filteredSongs.length === 0 ? (
          <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-500">
            {filterFavorites === "favorites" ? "Aucun favori." : "Aucun chant."}
          </div>
        ) : null}

        {filteredSongs.map((s) => {
          const active = s.id === selectedId;
          const isFavorite = favorites.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => onSongHover?.(s.id)}
              onMouseLeave={() => onSongHoverCancel?.()}
              className={[
                "w-full rounded-lg py-2.5 text-left transition-colors",
                active
                  ? "border-l-4 border-l-accent-500 dark:border-l-accent-400 bg-zinc-100 dark:bg-zinc-800/60 pl-3 pr-3"
                  : "border-l-4 border-l-transparent pl-3 pr-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/60",
              ].join(" ")}
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {collapsed ? "•" : (
                  <>
                    {isFavorite ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent-500 dark:text-accent-400" aria-hidden>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    ) : null}
                    {s.title}
                  </>
                )}
              </div>
              {collapsed ? null : (
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.artist ?? "—"}{" "}
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>{" "}
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

