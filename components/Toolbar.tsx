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
        <div className="text-sm font-semibold">Harmony</div>
        <div className="text-xs text-zinc-400">Admin Songbook</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="mr-2 text-xs text-zinc-400">
          {saving ? "Sauvegarde..." : dirty ? "Modifié" : "Sauvegardé"}
        </div>

        <button
          onClick={onNew}
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm hover:bg-zinc-900"
        >
          New
        </button>
        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          title="Ctrl/Cmd+S"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm hover:bg-zinc-900 disabled:opacity-60"
        >
          Delete
        </button>
        <button
          onClick={onImport}
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm hover:bg-zinc-900"
        >
          Import
        </button>
        <button
          onClick={onExport}
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm hover:bg-zinc-900"
        >
          Export
        </button>
      </div>
    </div>
  );
}

