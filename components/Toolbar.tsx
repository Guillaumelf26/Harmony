type Props = {
  dirty: boolean;
  saving: boolean;
  editMode?: boolean;
  onSave: () => void;
  onCancel?: () => void;
};

export function Toolbar({
  dirty,
  saving,
  editMode = false,
  onSave,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {(dirty || editMode) && onCancel ? (
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
        ) : null}
        {dirty ? (
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:from-accent-600 hover:to-accent-700 disabled:opacity-60 disabled:from-accent-500 disabled:to-accent-600 transition-all"
            title="Ctrl/Cmd+S"
          >
            Save
          </button>
        ) : null}
      </div>
    </div>
  );
}

