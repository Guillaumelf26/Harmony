"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { parseChordPro } from "@/chordpro/parse";
import { ChordProPreview } from "@/chordpro/render";
import { SidebarSongList } from "@/components/SidebarSongList";
import { Toolbar } from "@/components/Toolbar";
import { SessionMenu } from "@/components/SessionMenu";
import { EditorPane, type EditorPaneRef } from "@/components/EditorPane";
import { getChordsForKey } from "@/lib/chordsByKey";
import { appendChordExtension } from "@/lib/chordAtCursor";
import type { ChordAtCursorInfo } from "@/components/EditorPane";

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
  audioUrl: string | null;
  referenceUrl: string | null;
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
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaArtist, setMetaArtist] = useState("");
  const [metaKey, setMetaKey] = useState("");
  const [metaTags, setMetaTags] = useState("");
  const [metaReferenceUrl, setMetaReferenceUrl] = useState("");
  const [activeChordInfo, setActiveChordInfo] =
    useState<ChordAtCursorInfo | null>(null);
  const [popupCoords, setPopupCoords] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const POPUP_GAP = 8;
  const editorRef = useRef<EditorPaneRef>(null);

  const debouncedText = useDebouncedValue(editorText, 200);
  const previewDoc = useMemo(() => parseChordPro(debouncedText), [debouncedText]);
  const chordButtons = useMemo(() => getChordsForKey(metaKey), [metaKey]);

  const updatePopupPosition = useCallback(() => {
    if (!activeChordInfo) {
      setPopupCoords(null);
      return;
    }
    const view = editorRef.current?.view;
    if (!view) return;
    const coords = view.coordsAtPos(activeChordInfo.start);
    if (!coords) {
      setPopupCoords(null);
      return;
    }
    const centerX = (coords.left + coords.right) / 2;
    setPopupCoords({ left: centerX, top: coords.top });
  }, [activeChordInfo]);

  useEffect(() => {
    if (!activeChordInfo) {
      setPopupCoords(null);
      return;
    }
    updatePopupPosition();
    const onScroll = () => updatePopupPosition();
    const view = editorRef.current?.view;
    view?.scrollDOM?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      view?.scrollDOM?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeChordInfo, updatePopupPosition]);

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
    setMetaReferenceUrl(song.referenceUrl ?? "");
    setActiveChordInfo(null);
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
    setMetaReferenceUrl("");
    setEditorText("{title: Nouveau chant}\n\n");
    setActiveChordInfo(null);
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
            referenceUrl: metaReferenceUrl.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("save_failed");
        const updated = (await res.json()) as Song;
        setSelectedSong(updated);
        setMetaTitle(updated.title ?? title);
        setMetaArtist(updated.artist ?? artist ?? "");
        setMetaKey(updated.key ?? key ?? "");
        setMetaTags(tagsFromUnknown(updated.tags).join(", "));
        setMetaReferenceUrl(updated.referenceUrl ?? "");
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
          referenceUrl: metaReferenceUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      const created = (await res.json()) as Song;
      setSelectedId(created.id);
      setSelectedSong(created);
      setMetaTitle(created.title ?? title);
      setMetaArtist(created.artist ?? artist ?? "");
      setMetaKey(created.key ?? key ?? "");
      setMetaReferenceUrl(created.referenceUrl ?? "");
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
    setMetaReferenceUrl("");
    setActiveChordInfo(null);
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
    const insertText = `[${chord}]`;
    view.dispatch({ changes: { from, to, insert: insertText } });
    setDirty(true);
  }

  function handleChordAtCursorChange(info: ChordAtCursorInfo | null) {
    setActiveChordInfo(info);
  }

  function applyChordExtension(ext: "7" | "9" | "11") {
    if (!activeChordInfo) return;
    const view = editorRef.current?.view;
    if (!view) return;
    const newChord = appendChordExtension(activeChordInfo.chord, ext);
    const newInsert = `[${newChord}]`;
    view.dispatch({
      changes: {
        from: activeChordInfo.start,
        to: activeChordInfo.end,
        insert: newInsert,
      },
    });
    setDirty(true);
    setActiveChordInfo({
      chord: newChord,
      start: activeChordInfo.start,
      end: activeChordInfo.start + newInsert.length,
    });
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  async function onAudioFileSelected(files: FileList | null) {
    if (!files?.[0] || !selectedId) return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      const res = await fetch(`/api/songs/${selectedId}/audio`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        window.alert(err.message || "Erreur lors de l'upload");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      setSelectedSong((prev) => (prev ? { ...prev, audioUrl: url } : null));
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }

  async function onDeleteAudio() {
    if (!selectedId || !selectedSong?.audioUrl) return;
    if (!window.confirm("Supprimer le fichier audio de ce chant ?")) return;
    const res = await fetch(`/api/songs/${selectedId}/audio`, { method: "DELETE" });
    if (res.ok) {
      setSelectedSong((prev) => (prev ? { ...prev, audioUrl: null } : null));
    } else {
      window.alert("Erreur lors de la suppression");
    }
  }

  async function onImportFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (dirty) {
      const ok = window.confirm("Changements non sauvegardés. Importer quand même ?");
      if (!ok) return;
    }
    const fileArray = Array.from(files);
    setSaving(true);
    try {
      let firstCreatedId: string | null = null;
      let imported = 0;
      for (const file of fileArray) {
        const text = await file.text();
        const parsed = parseChordPro(text);
        const title = parsed.title?.trim() || file.name.replace(/\.(txt|chordpro|pro)$/i, "") || "Sans titre";
        const artist = parsed.artist?.trim() ?? null;
        const key = parsed.key?.trim() ?? null;
        const res = await fetch("/api/songs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            artist,
            key,
            tags: [],
            chordproText: text,
          }),
        });
        if (res.ok) {
          imported += 1;
          const created = (await res.json()) as Song;
          if (!firstCreatedId) firstCreatedId = created.id;
        }
      }
      await refreshList();
      if (firstCreatedId) await loadSong(firstCreatedId);
      if (imported < fileArray.length) {
        window.alert(`${imported} chant(s) importé(s) sur ${fileArray.length}. Certains ont peut-être échoué.`);
      }
    } finally {
      setSaving(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
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
          <div className="flex items-center gap-2">
            <Link
              href="/admin/settings"
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Paramètres"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
            <SessionMenu />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-12 gap-3 px-4 py-4">
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
          <div className="mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-3">
            <div className="grid grid-cols-12 gap-2">
              <label className="col-span-12 md:col-span-6">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Titre</div>
                <input
                  value={metaTitle}
                  onChange={(e) => {
                    setMetaTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-6">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Artiste</div>
                <input
                  value={metaArtist}
                  onChange={(e) => {
                    setMetaArtist(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Tonalité</div>
                <input
                  value={metaKey}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    setMetaKey(newKey);
                    setDirty(true);
                    // Synchroniser {key: X} dans le chordpro
                    const trimmed = newKey.trim();
                    if (trimmed) {
                      const keyLine = `{key: ${trimmed}}`;
                      const replaced = editorText.replace(/\{key\s*:\s*[^}]*\}/gi, keyLine);
                      setEditorText(replaced !== editorText ? replaced : (editorText ? `${keyLine}\n${editorText}` : keyLine));
                    } else {
                      setEditorText((prev) => prev.replace(/\{key\s*:\s*[^}]*\}\s*\n?/g, ""));
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="col-span-12 md:col-span-8">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Tags (séparés par des virgules)</div>
                <input
                  value={metaTags}
                  onChange={(e) => {
                    setMetaTags(e.target.value);
                    setDirty(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <div className="col-span-12">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Audio</div>
                {selectedSong?.audioUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <audio
                      src={selectedSong.audioUrl}
                      controls
                      className="h-8 max-w-full min-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={() => void onDeleteAudio()}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,video/mp4"
                      className="hidden"
                      onChange={(e) => void onAudioFileSelected(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={!selectedId || uploadingAudio}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-200 transition hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingAudio ? "Upload..." : "Upload audio"}
                    </button>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">mp3, wav, ogg, webm, mp4 (max 10 Mo)</span>
                  </div>
                )}
              </div>
              <label className="col-span-12">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Lien original (YouTube, etc.)</div>
                <input
                  type="url"
                  value={metaReferenceUrl}
                  onChange={(e) => {
                    setMetaReferenceUrl(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-3">
            <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Accords rapides (tonalité {metaKey.trim() || "—"})
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {chordButtons.map((chord) => (
                  <button
                    key={chord}
                    type="button"
                    onClick={() => insertChordAtCursor(chord)}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-200 transition hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-indigo-700 dark:hover:text-indigo-100"
                  >
                    {chord}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onRemoveChords}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-200 transition hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-indigo-700 dark:hover:text-indigo-100 shrink-0"
                title="Supprimer tous les accords [xxx] du chant"
              >
                Effacer accords
              </button>
            </div>
          </div>

          <EditorPane
            ref={editorRef}
            value={editorText}
            height={"calc(100vh - 160px)"}
            onChange={(v) => {
              setEditorText(v);
              setDirty(true);
            }}
            onChordAtCursorChange={handleChordAtCursorChange}
          />
        </div>

        <div className="col-span-6 md:col-span-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
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
        multiple
        onChange={(e) => void onImportFiles(e.target.files)}
      />

      {typeof document !== "undefined" &&
        activeChordInfo &&
        popupCoords &&
        createPortal(
          <div
            className="fixed z-50 flex gap-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 px-2 py-1.5 shadow-xl"
            style={{
              left: popupCoords.left,
              top: popupCoords.top - POPUP_GAP,
              transform: "translate(-50%, -100%)",
            }}
          >
            {(["7", "9", "11"] as const).map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => applyChordExtension(ext)}
                className="rounded px-2 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-200 transition hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-indigo-700 dark:hover:text-indigo-100"
                title={`Ajouter ${ext}`}
              >
                {ext}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

