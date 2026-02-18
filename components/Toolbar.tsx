type Props = {
  dirty: boolean;
  saving: boolean;
  hasSelection: boolean;
  onNew: () => void;
  onSave: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
};

export function Toolbar({
  dirty,
  saving,
  hasSelection,
  onNew,
  onSave,
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

        <button
          onClick={onNew}
          className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
        >
          New
        </button>
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
          className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900 disabled:opacity-60"
        >
          Delete
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

