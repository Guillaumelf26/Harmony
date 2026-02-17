"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseChordPro } from "@/chordpro/parse";
import { ChordProPreview } from "@/chordpro/render";
import { SidebarSongList } from "@/components/SidebarSongList";
import { Toolbar } from "@/components/Toolbar";
import { SessionMenu } from "@/components/SessionMenu";
import { EditorPane, type EditorPaneRef } from "@/components/EditorPane";
import { getChordsForKey } from "@/lib/chordsByKey";

type SongListItem = {
  id: string;
  title: string;
  artist: string | null;
  updatedAt: string;
  tags: string[];
};

type Song = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  tempo: number | null;
  timeSignature: string | null;
  tags: unknown;
  chordproText: string;
  createdAt: string;
  updatedAt: string;
};

function tagsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminClient() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editorText, setEditorText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaArtist, setMetaArtist] = useState("");
  const [metaKey, setMetaKey] = useState("");
  const [metaTags, setMetaTags] = useState("");
  const editorRef = useRef<EditorPaneRef>(null);

  const debouncedText = useDebouncedValue(editorText, 200);
  const previewDoc = useMemo(() => parseChordPro(debouncedText), [debouncedText]);
  const chordButtons = useMemo(() => getChordsForKey(metaKey), [metaKey]);

  async function refreshList() {
    const res = await fetch(`/api/songs?query=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: SongListItem[] };
    setSongs(data.items);
  }

  async function loadSong(id: string) {
    const res = await fetch(`/api/songs/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const song = (await res.json()) as Song;
    setSelectedId(id);
    setSelectedSong(song);
    setEditorText(song.chordproText ?? "");
    setMetaTitle(song.title ?? "");
    setMetaArtist(song.artist ?? "");
    setMetaKey(song.key ?? "");
    setMetaTags(tagsFromUnknown(song.tags).join(", "));
    setDirty(false);
  }

  useEffect(() => {
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refreshList(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function onSelect(id: string) {
    if (dirty && selectedId !== id) {
      const ok = window.confirm("Changements non sauvegardés. Continuer sans sauvegarder ?");
      if (!ok) return;
    }
    await loadSong(id);
  }

  async function onNew() {
    if (dirty) {
      const ok = window.confirm("Changements non sauvegardés. Créer un nouveau chant quand même ?");
      if (!ok) return;
    }
    setSelectedId(null);
    setSelectedSong(null);
    setMetaTitle("Nouveau chant");
    setMetaArtist("");
    setMetaKey("");
    setMetaTags("");
    setEditorText("{title: Nouveau chant}\n\n");
    setDirty(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      const parsed = parseChordPro(editorText);
      const title = metaTitle.trim() || parsed.title?.trim() || selectedSong?.title || "Sans titre";
      const artist = metaArtist.trim() || parsed.artist?.trim() || null;
      const key = metaKey.trim() || parsed.key?.trim() || null;
      const tags = metaTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (selectedId) {
        const res = await fetch(`/api/songs/${selectedId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            artist,
            key,
            tags,
            chordproText: editorText,
          }),
        });
        if (!res.ok) throw new Error("save_failed");
        const updated = (await res.json()) as Song;
        setSelectedSong(updated);
        setMetaTitle(updated.title ?? title);
        setMetaArtist(updated.artist ?? artist ?? "");
        setMetaKey(updated.key ?? key ?? "");
        setMetaTags(tagsFromUnknown(updated.tags).join(", "));
        setDirty(false);
        await refreshList();
        return;
      }

      // create
      const res = await fetch(`/api/songs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          key,
          tags,
          chordproText: editorText,
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      const created = (await res.json()) as Song;
      setSelectedId(created.id);
      setSelectedSong(created);
      setMetaTitle(created.title ?? title);
      setMetaArtist(created.artist ?? artist ?? "");
      setMetaKey(created.key ?? key ?? "");
      setMetaTags(tagsFromUnknown(created.tags).join(", "));
      setDirty(false);
      await refreshList();
    } finally {
      setSaving(false);
    }
  }

  function onRemoveChords() {
    const ok = window.confirm(
      "Effacer tous les accords entre crochets [xxx] du chant ? Les paroles seront conservées."
    );
    if (!ok) return;
    const newText = editorText.replace(/\[[^\]]*\]/g, "");
    setEditorText(newText);
    setDirty(true);
  }

  async function onDelete() {
    if (!selectedId) return;
    const ok = window.confirm("Supprimer ce chant ? Cette action est irréversible.");
    if (!ok) return;

    const res = await fetch(`/api/songs/${selectedId}`, { method: "DELETE" });
    if (!res.ok) return;
    setSelectedId(null);
    setSelectedSong(null);
    setEditorText("");
    setMetaTitle("");
    setMetaArtist("");
    setMetaKey("");
    setMetaTags("");
    setDirty(false);
    await refreshList();
  }

  function onExport() {
    const text = editorText;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (metaTitle || selectedSong?.title || "song").replace(/[^\w\-]+/g, "_");
    a.href = url;
    a.download = `${safeTitle}.chordpro.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function insertChordAtCursor(chord: string) {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({ changes: { from, to, insert: `[${chord}]` } });
    setDirty(true);
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const parsed = parseChordPro(text);
    // Import = nouveau chant (ne pas écraser la sélection)
    setSelectedId(null);
    setSelectedSong(null);
    setEditorText(text);
    setMetaTitle(parsed.title ?? "");
    setMetaArtist(parsed.artist ?? "");
    setMetaKey(parsed.key ?? "");
    setMetaTags("");
    setDirty(true);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      e.preventDefault();
      void onSave();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorText, selectedId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Toolbar
            dirty={dirty}
            saving={saving}
            hasSelection={!!selectedId}
            onNew={onNew}
            onSave={onSave}
            onDelete={onDelete}
            onExport={onExport}
            onImport={onImportClick}
          />
          <SessionMenu />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-3 px-4 py-4">
        <div className={sidebarCollapsed ? "col-span-1" : "col-span-3"}>
          <SidebarSongList
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
            query={query}
            onQueryChange={setQuery}
            songs={songs}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>

        <div className={sidebarCollapsed ? "col-span-6" : "col-span-5"}>
          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <div className="grid grid-cols-12 gap-2">
              <label className="col-span-12 md:col-span-6">
                <div className="text-xs text-zinc-400">Titre</div>
                <input
                  value={metaTitle}
                  onChange={(e) => {
                    setMetaTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-6">
                <div className="text-xs text-zinc-400">Artiste</div>
                <input
                  value={metaArtist}
                  onChange={(e) => {
                    setMetaArtist(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-4">
                <div className="text-xs text-zinc-400">Tonalité</div>
                <input
                  value={metaKey}
                  onChange={(e) => {
                    setMetaKey(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-8">
                <div className="text-xs text-zinc-400">Tags (séparés par des virgules)</div>
                <input
                  value={metaTags}
                  onChange={(e) => {
                    setMetaTags(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Accords rapides (tonalité {metaKey.trim() || "—"})
              </div>
              <button
                type="button"
                onClick={onRemoveChords}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-indigo-200 transition hover:bg-zinc-700 hover:text-indigo-100"
                title="Supprimer tous les accords [xxx] du chant"
              >
                Effacer accords
              </button>
            </div>
            {chordButtons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chordButtons.map((chord) => (
                  <button
                    key={chord}
                    type="button"
                    onClick={() => insertChordAtCursor(chord)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-indigo-200 transition hover:bg-zinc-700 hover:text-indigo-100"
                  >
                    {chord}
                  </button>
                ))}
              </div>
            )}
          </div>

          <EditorPane
            ref={editorRef}
            value={editorText}
            height={"calc(100vh - 160px)"}
            onChange={(v) => {
              setEditorText(v);
              setDirty(true);
            }}
          />
        </div>

        <div className="col-span-6 md:col-span-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
              Preview live
            </div>
            <div className="h-[calc(100vh-160px)] overflow-auto p-3">
              <ChordProPreview doc={previewDoc} />
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.chordpro,.pro"
        className="hidden"
        onChange={(e) => void onImportFile(e.target.files?.item(0) ?? null)}
      />
    </div>
  );
}

