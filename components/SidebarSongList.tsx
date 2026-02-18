type SongListItem = {
  id: string;
  title: string;
  artist: string | null;
  updatedAt: string;
  tags: string[];
};

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  songs: SongListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function SidebarSongList({
  collapsed,
  onToggleCollapsed,
  query,
  onQueryChange,
  songs,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{collapsed ? "♫" : "Chants"}</div>
        <button
          onClick={onToggleCollapsed}
          className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          title={collapsed ? "Déplier" : "Rétracter"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {collapsed ? null : (
        <div className="p-3">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Recherche titre / artiste"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className={collapsed ? "p-2" : "max-h-[calc(100vh-220px)] overflow-auto px-2 pb-2"}>
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

