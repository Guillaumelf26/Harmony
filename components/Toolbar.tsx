type Props = {
  dirty: boolean;
  saving: boolean;
  hasSelection: boolean;
  onSave: () => void;
  onCancel?: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
};

export function Toolbar({
  dirty,
  saving,
  hasSelection,
  onSave,
  onCancel,
  onDelete,
  onExport,
  onImport,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Harmony</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Admin Songbook</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-2 text-xs text-zinc-500 dark:text-zinc-400">
          {saving ? "Sauvegarde..." : dirty ? "Modifié" : "Sauvegardé"}
        </div>

        {dirty && onCancel ? (
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
        ) : null}
        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-60 disabled:from-indigo-500 disabled:to-indigo-600 transition-all"
          title="Ctrl/Cmd+S"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Supprimer"
          aria-label="Supprimer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
        <button
          onClick={onImport}
          className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
        >
          Import
        </button>
        <button
          onClick={onExport}
          className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
        >
          Export
        </button>
      </div>
    </div>
  );
}

