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
  songs: SongListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew?: () => void;
  /** Mode overlay : bouton fermer (×) au lieu de « */
  overlay?: boolean;
};

export function SidebarSongList({
  collapsed = false,
  onToggleCollapsed,
  query,
  onQueryChange,
  songs,
  selectedId,
  onSelect,
  onNew,
  overlay = false,
}: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none border-0 bg-white/50 dark:bg-zinc-950/30">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Chants</div>
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

      {collapsed ? null : (
        <div className="p-3">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Recherche titre / artiste"
              className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/30 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {onNew ? (
              <button
                type="button"
                onClick={onNew}
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors"
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
        </div>
      )}

      <div className={`flex-1 min-h-0 overflow-auto ${collapsed ? "p-2" : "px-2 pb-2"}`}>
        {songs.length === 0 ? (
          <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-500">Aucun chant.</div>
        ) : null}

        {songs.map((s) => {
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={[
                "w-full rounded-lg px-2 py-2 text-left",
                active
                  ? "bg-indigo-100 dark:bg-indigo-600/20 ring-1 ring-indigo-600/40"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60",
              ].join(" ")}
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{collapsed ? "•" : s.title}</div>
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

